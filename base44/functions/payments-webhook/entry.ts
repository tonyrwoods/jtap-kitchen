// Base44 Payments fulfillment webhook — base44/functions/payments-webhook/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (JWT verification, envelope parsing,
// purchase resolution, idempotency). Only edit the region marked
// `// ===== APP-SPECIFIC =====` to define what "grant access" means for this app.
//
// It receives Wix `ORDER_APPROVED` events (and optional subscription lifecycle events),
// verifies the RS256 JWT, resolves the buyer's pending Purchase by checkout id, and marks
// it paid exactly once. It pairs with `create-checkout`, which MUST persist
// `checkoutSession.id` on the Purchase — Wix has no custom-metadata field, so the checkout
// id is the ONLY correlation key back to this app's user.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { importSPKI, jwtVerify } from "npm:jose@5.9.6";
import { sendTransactionalEmail } from "../../shared/sendTransactionalEmail.js";

// Wix event types (verbatim from Wix docs).
const ORDER_APPROVED = "wix.ecom.v1.order_approved";
const SUBSCRIPTION_CANCELED = "wix.ecom.subscription_contracts.v1.subscription_contract_canceled";
const SUBSCRIPTION_EXPIRED = "wix.ecom.subscription_contracts.v1.subscription_contract_expired";

// Unwrap Wix's triple-nested envelope: the request body is a JWT whose verified
// payload has a `data` JSON string; that parses to an envelope with `eventType` and
// another `data` JSON string; that parses to the event data, which for these events
// wraps the entity in a per-action wrapper (see extractOrder).
function parseWixEnvelope(payload: Record<string, unknown>): { eventType: string; eventData: any } {
  const outer = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
  // eventType lives on the parsed envelope; newer DomainEvent envelopes may also carry it as a
  // top-level JWT claim — fall back to that so the event isn't misrouted to the ignore branch.
  const eventType: string = outer?.eventType ?? (payload.eventType as string) ?? "";
  const eventData = typeof outer?.data === "string" ? JSON.parse(outer.data) : outer?.data;
  return { eventType, eventData };
}

// order_approved is an ACTION event: the order is at `actionEvent.body.order`
// (per the Wix docs' sample payload, where `order.checkoutId === checkoutSession.id`).
// The flat `order` / `entity` forms are fallbacks for the other envelope variants Wix emits.
function extractOrder(eventData: any): any | null {
  return eventData?.actionEvent?.body?.order ?? eventData?.order ?? eventData?.entity ?? null;
}

// The buyer's email, as entered on Wix's hosted checkout page. This is the ONLY identity for an
// anonymous buyer (one who wasn't signed in when create-checkout ran, so appUserId is null). Wix
// exposes it in a few places depending on the flow; check the common ones.
function extractBuyerEmail(order: any): string | null {
  return (
    order?.buyerInfo?.email ??
    order?.billingInfo?.contactDetails?.email ??
    order?.billingInfo?.email ??
    null
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Read per request, never at module scope: the key is stored when the webhook is registered, so
    // a warm isolate that captured it at startup would stay keyless and 500 every ORDER_APPROVED.
    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY");
    if (!WEBHOOK_PUBLIC_KEY) {
      // Never process an unverifiable event. Missing key = misconfiguration, not a retry case.
      console.error("payments-webhook: WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY is not set");
      return new Response("Webhook not configured", { status: 500 });
    }

    // The raw body IS the JWT (Wix signs the whole payload, RS256).
    const token = await req.text();

    let payload: Record<string, unknown>;
    try {
      const key = await importSPKI(WEBHOOK_PUBLIC_KEY, "RS256");
      const verified = await jwtVerify(token, key);
      payload = verified.payload as Record<string, unknown>;
    } catch (err) {
      // Signature invalid / malformed. Reject — do NOT grant anything.
      console.error("payments-webhook: JWT verification failed", err);
      return new Response("Invalid signature", { status: 401 });
    }

    const { eventType, eventData } = parseWixEnvelope(payload);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole; // No end user is authenticated on a webhook call.

    if (eventType === ORDER_APPROVED) {
      return await handleOrderApproved(base44, eventData);
    }

    if (eventType === SUBSCRIPTION_CANCELED || eventType === SUBSCRIPTION_EXPIRED) {
      return await handleSubscriptionEnded(db, eventData);
    }

    // Unknown/irrelevant event — acknowledge so Wix stops retrying.
    console.log(`payments-webhook: ignoring event ${eventType}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    // Unexpected failure: 500 tells Wix to retry later (the handler is idempotent, so a
    // retry after a partial failure is safe).
    console.error("payments-webhook: unhandled error", err);
    return new Response("Internal error", { status: 500 });
  }
});

async function handleOrderApproved(base44: any, eventData: any): Promise<Response> {
  const db = base44.asServiceRole;
  const order = extractOrder(eventData);
  const checkoutId: string | undefined = order?.checkoutId;
  const orderId: string | undefined = order?.id;
  // Subscription id (if any) — persisted below so SUBSCRIPTION_CANCELED/EXPIRED can later
  // resolve this purchase by subscriptionId and revoke access.
  const subscriptionId: string | undefined = (order?.lineItems ?? [])
    .map((li: any) => li?.subscriptionInfo?.id)
    .find((id: any) => !!id);

  if (!checkoutId) {
    // Nothing to correlate on. Acknowledge to stop retries; log for investigation.
    console.error("payments-webhook: ORDER_APPROVED missing order.checkoutId", { orderId });
    return new Response("OK", { status: 200 });
  }

  // Resolve the pending purchase created by `create-checkout` (join key: checkoutSessionId).
  const matches = await db.entities.Base44Purchase.filter({ checkoutSessionId: checkoutId });
  const purchase = matches?.[0];

  if (!purchase) {
    // The pending Base44Purchase is written by create-checkout before the buyer pays, so a miss
    // here is a transient race (entity not yet visible) — return 500 so Wix retries, rather
    // than ACKing a paid order we can't fulfill. (Wix stops after its retry window.)
    console.warn("payments-webhook: no Base44Purchase for checkoutId yet, asking Wix to retry", { checkoutId, orderId });
    return new Response("Purchase not found yet", { status: 500 });
  }

  // IDEMPOTENCY + terminal states: Wix delivers ORDER_APPROVED more than once, and may deliver
  // a stale approval after a cancellation. Skip if already "paid" (prevents double-grant) or
  // "canceled" (a late approval must not resurrect a revoked subscription).
  if (purchase.status === "paid" || purchase.status === "canceled") {
    console.log("payments-webhook: purchase already terminal, skipping", { checkoutId, status: purchase.status });
    return new Response("OK", { status: 200 });
  }

  // The buyer's email: from create-checkout if they were signed in, otherwise from the Wix order
  // (the only identity an anonymous buyer has). Persisted below and used by the grant block.
  const buyerEmail: string | null = purchase.buyerEmail ?? extractBuyerEmail(order);

  // ===== APP-SPECIFIC =====
  // Gift card fulfillment: activate the gift card on payment. The status flip
  // triggers the sendGiftCardConfirmation entity automation (Pending → Active),
  // which emails the purchaser and recipient. Idempotent: only flip if still pending.
  if (purchase.productId && purchase.productId.startsWith("giftcard:")) {
    const giftCardId = purchase.productId.slice("giftcard:".length);
    try {
      const card = await db.entities.GiftCard.get(giftCardId);
      if (card && card.status === "Pending Payment") {
        await db.entities.GiftCard.update(giftCardId, { status: "Active" });
      }
    } catch (e) {
      console.error("payments-webhook: gift card activation failed", e);
      throw e; // re-throw so status stays pending and Wix retries the grant
    }
  }

  // Paid event ticket: confirm the held reservation and email the guest. The seats were
  // already held (decremented) by submitEventBooking, so there's no overbooking race here.
  // Idempotent: only act if still "Pending Payment".
  if (purchase.productId && purchase.productId.startsWith("event:")) {
    const reservationId = purchase.productId.slice("event:".length);
    try {
      const reservation = await db.entities.Reservation.get(reservationId);
      if (!reservation) {
        throw new Error("Reservation not found for paid event purchase");
      }
      if (reservation.status === "Pending Payment") {
        let eventTitle = "Special Event";
        if (reservation.event_id) {
          const evt = await db.entities.Event.get(reservation.event_id);
          if (evt) eventTitle = evt.title;
        }
        await db.entities.Reservation.update(reservationId, { status: "Confirmed" });
        try {
          await sendEventConfirmationEmail(base44, reservation, eventTitle);
        } catch (mailErr) {
          console.error("payments-webhook: event confirmation email failed", mailErr);
        }
      }
    } catch (e) {
      console.error("payments-webhook: event reservation confirmation failed", e);
      throw e;
    }
  }
  // Grant whatever the buyer paid for. This runs BEFORE we mark the purchase paid: if it
  // throws or times out, the status stays "pending", so Wix's retry re-runs the grant
  // rather than hitting the "already paid" short-circuit above and skipping it forever.
  //
  // It MUST therefore be idempotent — Wix can also deliver duplicates CONCURRENTLY, so the
  // "pending" check above is NOT a lock: two invocations can both reach this block. Make every
  // effect safe to run twice by keying it on a stable id (purchase.id / checkoutId), never
  // blind-create/blind-send:
  //   - unlock a feature:   await db.entities.User.update(purchase.appUserId, { plan: purchase.productId });  // update is naturally idempotent
  //   - create entitlement: const existing = await db.entities.Entitlement.filter({ purchaseId: purchase.id });
  //                         if (!existing.length) await db.entities.Entitlement.create({ purchaseId: purchase.id, ... });
  //   - one-time side effects (email/webhook): guard them the same way — record a marker keyed
  //     on purchase.id and skip if it already exists, so a duplicate delivery can't send twice.
  //   - QUANTITY: for a multi-unit purchase grant `purchase.quantity` (seats/credits/items), not a
  //     single unit — it's the validated count create-checkout charged for. Fixed-entitlement = 1.
  //   - subscriptions:      subscriptionId is persisted automatically below, for later revoke.
  //   - GRANT TARGET: use purchase.appUserId when set (the built-in `User` entity — there is no
  //     `AppUser`). For an anonymous buyer (appUserId null) match `buyerEmail` (resolved above)
  //     against User; User records CANNOT be created here (invite-only), so when no user matches,
  //     grant to an Entitlement row keyed on the email and claim it when they sign up.
  //   - Gate paid access on a WRITABLE field you set here (e.g. plan / has_paid on the user or an
  //     Entitlement row) — NEVER on is_verified: it is platform-protected and cannot be set here,
  //     even as service role, so gating access on it locks the paying buyer out.
  // ===== END APP-SPECIFIC =====

  // Mark paid LAST, so "paid" always implies the grant above completed. The idempotency
  // check at the top short-circuits on this status, so it must only be set after fulfillment.
  // subscriptionId is stored here so SUBSCRIPTION_CANCELED/EXPIRED can resolve this purchase.
  await db.entities.Base44Purchase.update(purchase.id, {
    status: "paid",
    orderId: orderId ?? purchase.orderId ?? null,
    subscriptionId: subscriptionId ?? purchase.subscriptionId ?? null,
    // Persist the buyer email (backfilled from the Wix order for anonymous buyers) so the record
    // always shows who paid, even when create-checkout had no signed-in user.
    buyerEmail: buyerEmail ?? purchase.buyerEmail ?? null,
    paidAt: new Date().toISOString(),
  });

  console.log("payments-webhook: fulfilled purchase", { purchaseId: purchase.id, checkoutId, orderId });
  return new Response("OK", { status: 200 });
}

async function handleSubscriptionEnded(db: any, eventData: any): Promise<Response> {
  // Canceled = ended early; Expired = ran all billing cycles. Both revoke access.
  // Mirrors the order path (actionEvent.body.<entity> first); keep the flat fallbacks since
  // the subscription contract webhook body isn't as tightly documented as order_approved.
  const contract =
    eventData?.actionEvent?.body?.subscriptionContract ??
    eventData?.subscriptionContract ??
    eventData?.entity ??
    null;
  const subscriptionId: string | undefined = contract?.id;

  if (!subscriptionId) {
    console.error("payments-webhook: subscription event missing contract id");
    return new Response("OK", { status: 200 });
  }

  const matches = await db.entities.Base44Purchase.filter({ subscriptionId });
  const purchase = matches?.[0];
  if (!purchase) {
    // The subscriptionId is written on the Purchase by the ORDER_APPROVED handler. If a
    // cancel/expire arrives before (or racing) that approval, no Purchase matches yet —
    // return 500 so Wix retries until the approval has linked it, instead of losing the
    // revoke by acking a not-yet-linkable event.
    console.warn("payments-webhook: no Purchase for subscription yet, asking Wix to retry", { subscriptionId });
    return new Response("Purchase not linkable yet", { status: 500 });
  }

  if (purchase.status === "canceled") {
    return new Response("OK", { status: 200 }); // Idempotent.
  }

  // ===== APP-SPECIFIC =====
  // Revoke whatever access the subscription granted (mirror of the grant). Runs BEFORE we
  // mark the purchase canceled: if it throws, the status stays as-is so Wix's retry re-runs
  // the revoke rather than hitting the "already canceled" short-circuit and leaving access on.
  // Must be idempotent.
  // ===== END APP-SPECIFIC =====

  // Mark canceled LAST, so "canceled" always implies access was actually revoked.
  await db.entities.Base44Purchase.update(purchase.id, {
    status: "canceled",
    canceledAt: new Date().toISOString(),
  });

  console.log("payments-webhook: revoked subscription", { purchaseId: purchase.id, subscriptionId });
  return new Response("OK", { status: 200 });
}

function fmtEventDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

async function sendEventConfirmationEmail(base44: any, reservation: any, eventTitle: string): Promise<void> {
  const confirmationNo = (reservation.id || "").substring(0, 8).toUpperCase();
  const partyLabel = `${reservation.party_size} guest${reservation.party_size !== 1 ? "s" : ""}`;
  const subject = `Event Booking Confirmed — ${eventTitle}`;
  const body = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:24px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Event Booking Confirmed</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${reservation.guest_name},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Your booking for <strong>${eventTitle}</strong> is confirmed. We're excited to welcome you!</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Event:</strong> ${eventTitle}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${fmtEventDate(reservation.date)}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${reservation.time || ""}</p>
        <p style="margin:0;font-size:14px;"><strong>Party size:</strong> ${partyLabel}</p>
        <p style="margin:12px 0 0;font-size:13px;color:#777;font-family:monospace;"><strong>Confirmation #:</strong> ${confirmationNo}</p>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431</p>
    </div>
  </div>
</body></html>`;
  await sendTransactionalEmail(base44, { to: reservation.email, subject, body, from_name: "JTAP Kitchen" });
}