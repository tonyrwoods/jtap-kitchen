// Reservation deposit — Stripe webhook handler.
// Verifies the Stripe signature (manual Web Crypto HMAC-SHA256), then on
// checkout.session.completed marks the linked Reservation deposit "Paid"
// and flips status to "Pending" (awaits admin confirmation). Idempotent.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { secrets } from "base44:runtime";

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
  const ageMs = Math.abs(Date.now() - Number(parts.timestamp) * 1000);
  if (Number.isNaN(ageMs) || ageMs > 5 * 60 * 1000) {
    throw new Error("Timestamp outside tolerance");
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const digestBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${parts.timestamp}.${rawBody}`));
  const computed = Array.from(new Uint8Array(digestBuf))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const base44 = createClientFromRequest(req);
    const webhookSecret = secrets.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("stripe-reservation-deposit-webhook: STRIPE_WEBHOOK_SECRET not set");
      return Response.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    let event;
    try {
      event = await verifyStripeSignature(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("stripe-reservation-deposit-webhook: signature verification failed", err.message);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const session = event.data && event.data.object;
    const shouldFulfill =
      event.type === "checkout.session.async_payment_succeeded" ||
      (event.type === "checkout.session.completed" && session && session.payment_status === "paid");

    if (!shouldFulfill) {
      console.log("stripe-reservation-deposit-webhook: ignoring event", { type: event.type });
      return Response.json({ received: true, ignored: event.type });
    }

    const reservationId = (session && (session.client_reference_id || (session.metadata && session.metadata.reservation_id))) || "";
    if (!reservationId) {
      console.error("stripe-reservation-deposit-webhook: session missing reservation reference");
      return Response.json({ error: "No reservation reference" }, { status: 400 });
    }

    const db = base44.asServiceRole;
    const reservation = await db.entities.Reservation.get(reservationId);
    if (!reservation) {
      console.error("stripe-reservation-deposit-webhook: reservation not found", reservationId);
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Idempotent: only act while deposit is Unpaid
    if (reservation.deposit_status === "Unpaid") {
      const paymentId = (session && (session.payment_intent || session.id)) || null;
      await db.entities.Reservation.update(reservationId, {
        deposit_status: "Paid",
        status: "Confirmed",
        confirmed_at: new Date().toISOString(),
        stripe_payment_id: paymentId,
      });
      console.log("stripe-reservation-deposit-webhook: deposit paid", { reservationId });
    } else {
      console.log("stripe-reservation-deposit-webhook: already processed", { reservationId, status: reservation.deposit_status });
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("stripe-reservation-deposit-webhook: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}