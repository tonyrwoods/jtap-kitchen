// Event Center deposit — Stripe Checkout Session creator.
// Public (no auth gate): a buyer need not be logged in to pay the deposit.
// Resolves the inquiry + deposit amount SERVER-SIDE from the package tier
// (the client never sends a price), creates a Stripe Checkout Session, and
// returns { redirectUrl } so the wizard can redirect the buyer to Stripe.
// Correlation back to the inquiry uses Stripe's client_reference_id + metadata
// (Stripe supports custom metadata, unlike Wix), so no pending purchase row is needed.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { secrets } from "base44:runtime";
import { depositForPackage } from "../../shared/eventDeposit.js";

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
      console.error("create-event-deposit-checkout: STRIPE_SECRET_KEY not set");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }
    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      console.error("create-event-deposit-checkout: no app URL (X-Base44-App-Url, APP_URL, WIX_CHECKOUT_APP_URL all empty)");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const inquiryId = String(body.inquiryId || "").replace(/^eventdeposit:/, "").trim();
    if (!inquiryId) {
      return Response.json({ error: "Missing inquiry id" }, { status: 400 });
    }

    const inquiry = await base44.asServiceRole.entities.EventCenterInquiry.get(inquiryId);
    if (!inquiry) {
      return Response.json({ error: "Event inquiry not found" }, { status: 400 });
    }
    if (inquiry.deposit_status !== "Unpaid") {
      return Response.json({ error: "This inquiry is no longer eligible for checkout." }, { status: 400 });
    }
    // Authoritative deposit resolved server-side from the package tier.
    const deposit = depositForPackage(inquiry.package);
    if (!deposit || deposit < 0.5) {
      return Response.json({ error: "Invalid deposit amount for this package" }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(deposit * 100)));
    params.set("line_items[0][price_data][product_data][name]", `JTAP Kitchen Event Deposit — ${inquiry.package || "Event"}`);
    params.set("line_items[0][quantity]", "1");
    params.set("client_reference_id", inquiryId);
    params.set("metadata[inquiry_id]", inquiryId);
    if (inquiry.package) params.set("metadata[package]", inquiry.package);
    params.set("metadata[deposit_amount]", String(deposit));
    if (inquiry.email) params.set("customer_email", inquiry.email);
    params.set("success_url", `${appUrl}/event-confirmed?id=${inquiryId}`);
    params.set("cancel_url", `${appUrl}/event-center`);

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
      console.error("create-event-deposit-checkout: Stripe session create failed", { status: stripeRes.status, errText });
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }

    const session = await stripeRes.json();
    const redirectUrl = session?.url;
    if (!redirectUrl) {
      console.error("create-event-deposit-checkout: Stripe returned no session url", session);
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }
    return Response.json({ redirectUrl });
  } catch (err) {
    console.error("create-event-deposit-checkout: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}