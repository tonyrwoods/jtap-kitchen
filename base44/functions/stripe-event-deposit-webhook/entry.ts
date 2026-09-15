// Event Center deposit — Stripe webhook handler.
// Verifies the Stripe signature (manual Web Crypto HMAC-SHA256, no SDK dependency),
// then on `checkout.session.completed` marks the linked EventCenterInquiry deposit
// "Paid" and sends the deposit-received email. Idempotent: only acts while the
// inquiry's deposit_status is still "Unpaid", so Stripe redeliveries don't double-pay
// or double-email. Public endpoint (no user auth) — authenticity comes from the signature.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { secrets } from "base44:runtime";
import { sendEventDepositEmail } from "../../shared/sendEventDepositEmail.js";

// Stripe signs webhooks as: t=<timestamp>,v1=<hex hmac of "{timestamp}.{rawBody}">.
// We recompute the HMAC with Web Crypto and constant-time compare against each v1.
async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) throw new Error("Missing stripe-signature header");
  const parts = { timestamp: null, signatures: [] };
  for (const piece of signatureHeader.split(",")) {
    const idx = piece.indexOf("=");
    if (idx < 0) continue;
    const k = piece.slice(0, idx).trim();
    const v = piece.slice(idx + 1).trim();
    if (k === "t") parts.timestamp = v;
    else if (k === "v1") parts.signatures.push(v);
  }
  if (!parts.timestamp || parts.signatures.length === 0) {
    throw new Error("Malformed stripe-signature header");
  }
  // Reject replays older than 5 minutes.
  const ageMs = Math.abs(Date.now() - Number(parts.timestamp) * 1000);
  if (Number.isNaN(ageMs) || ageMs > 5 * 60 * 1000) {
    throw new Error("Timestamp outside tolerance");
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digestBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${parts.timestamp}.${rawBody}`));
  const computed = Array.from(new Uint8Array(digestBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  let matched = false;
  for (const sig of parts.signatures) {
    if (sig.length !== computed.length) continue;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ computed.charCodeAt(i);
    if (diff === 0) { matched = true; break; }
  }
  if (!matched) throw new Error("Signature mismatch");
  return JSON.parse(rawBody);
}

export default async function(req) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    // base44 auth setup BEFORE Stripe signature validation (per platform guidance).
    const base44 = createClientFromRequest(req);
    const webhookSecret = secrets.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("stripe-event-deposit-webhook: STRIPE_WEBHOOK_SECRET not set");
      return Response.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    let event;
    try {
      event = await verifyStripeSignature(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("stripe-event-deposit-webhook: signature verification failed", err.message);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const session = event.data && event.data.object;

    // Fulfill only when the session is actually paid: completed(paid) for card,
    // or async_payment_succeeded for delayed payment methods. For completed
    // sessions still pending (async), wait for the succeeded event.
    const shouldFulfill =
      event.type === "checkout.session.async_payment_succeeded" ||
      (event.type === "checkout.session.completed" && session && session.payment_status === "paid");

    if (!shouldFulfill) {
      // expired / async_payment_failed / completed-but-unpaid: no fulfillment.
      // The inquiry stays Unpaid so the team can see no payment landed.
      console.log("stripe-event-deposit-webhook: ignoring event", { type: event.type, payment_status: session && session.payment_status });
      return Response.json({ received: true, ignored: event.type });
    }

    const inquiryId = (session && (session.client_reference_id || (session.metadata && session.metadata.inquiry_id))) || "";
    if (!inquiryId) {
      console.error("stripe-event-deposit-webhook: session missing inquiry reference", { id: session && session.id });
      return Response.json({ error: "No inquiry reference on session" }, { status: 400 });
    }

    const db = base44.asServiceRole;
    const inquiry = await db.entities.EventCenterInquiry.get(inquiryId);
    if (!inquiry) {
      console.error("stripe-event-deposit-webhook: inquiry not found", inquiryId);
      return Response.json({ error: "Inquiry not found" }, { status: 404 });
    }

    // Idempotent: only act while unpaid. Stripe may redeliver the same event.
    if (inquiry.deposit_status === "Unpaid") {
      const paymentId = (session && (session.payment_intent || session.id)) || null;
      await db.entities.EventCenterInquiry.update(inquiryId, {
        deposit_status: "Paid",
        status: "New",
        stripe_payment_id: paymentId,
      });
      try {
        await sendEventDepositEmail(base44, inquiry, Number(inquiry.deposit_amount || 0));
      } catch (mailErr) {
        console.error("stripe-event-deposit-webhook: confirmation email failed", mailErr.message);
      }
    } else {
      console.log("stripe-event-deposit-webhook: inquiry already processed", { inquiryId, status: inquiry.deposit_status });
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("stripe-event-deposit-webhook: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}