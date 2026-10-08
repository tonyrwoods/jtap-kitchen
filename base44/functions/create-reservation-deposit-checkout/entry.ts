// Reservation deposit — Stripe Checkout Session creator.
// Public (no auth gate): a guest need not be logged in to pay a deposit.
// Resolves the reservation + deposit amount SERVER-SIDE from AppSettings
// (the client never sends a price), creates a Stripe Checkout Session, and
// returns { redirectUrl }. Correlation uses client_reference_id + metadata.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { secrets } from "base44:runtime";

function resolveAppUrl(req) {
  return (
    req.headers.get("x-base44-app-url") ||
    Deno.env.get("APP_URL") ||
    Deno.env.get("WIX_CHECKOUT_APP_URL") ||
    ""
  );
}

export default async function(req) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    const stripeSecret = secrets.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      console.error("create-reservation-deposit-checkout: STRIPE_SECRET_KEY not set");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }
    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      console.error("create-reservation-deposit-checkout: no app URL");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const reservationId = String(body.reservationId || "").trim();
    if (!reservationId) {
      return Response.json({ error: "Missing reservation id" }, { status: 400 });
    }

    const reservation = await base44.asServiceRole.entities.Reservation.get(reservationId);
    if (!reservation) {
      return Response.json({ error: "Reservation not found" }, { status: 400 });
    }
    if (reservation.deposit_status === "Paid") {
      return Response.json({ error: "Deposit has already been paid." }, { status: 400 });
    }
    if (reservation.status !== "Pending Payment") {
      return Response.json({ error: "This reservation is no longer eligible for deposit checkout." }, { status: 400 });
    }

    // Resolve deposit amount from AppSettings (server-authoritative)
    const settingsPage = await base44.asServiceRole.entities.AppSettings.filter({}, { limit: 1 });
    const settings = settingsPage.items?.[0] || settingsPage[0];
    if (!settings) {
      return Response.json({ error: "Settings not configured" }, { status: 500 });
    }

    const depositPerGuest = Number(settings.reservation_deposit_amount) || 10;
    const deposit = depositPerGuest * (Number(reservation.party_size) || 1);
    if (deposit < 0.5) {
      return Response.json({ error: "Deposit amount too low" }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(deposit * 100)));
    params.set("line_items[0][price_data][product_data][name]", `JTAP Kitchen Reservation Deposit — Party of ${reservation.party_size}`);
    params.set("line_items[0][quantity]", "1");
    params.set("client_reference_id", reservationId);
    params.set("metadata[reservation_id]", reservationId);
    params.set("metadata[deposit_amount]", String(deposit));
    if (reservation.email) params.set("customer_email", reservation.email);
    params.set("success_url", `${appUrl}/reserve/${reservation.confirm_token || reservationId}?deposit=paid`);
    params.set("cancel_url", `${appUrl}/book`);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errText = await stripeRes.text();
      console.error("create-reservation-deposit-checkout: Stripe session create failed", { status: stripeRes.status, errText });
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }

    const session = await stripeRes.json();
    const redirectUrl = session?.url;
    if (!redirectUrl) {
      console.error("create-reservation-deposit-checkout: Stripe returned no session url", session);
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }

    // Persist deposit amount on the reservation
    await base44.asServiceRole.entities.Reservation.update(reservationId, {
      deposit_amount: deposit,
    });

    return Response.json({ redirectUrl });
  } catch (err) {
    console.error("create-reservation-deposit-checkout: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}