// Takeout order checkout — Wix Payments (Base44 Payments).
// Public (no auth gate): a buyer need not be logged in to pay for takeout.
// Resolves the pending takeout Order SERVER-SIDE, builds a multi-item Wix cart
// from its validated line items, and returns { redirectUrl }.
// Correlation: productId "takeout:{orderId}" on the Base44Purchase row;
// the webhook marks the order paid when Wix confirms.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const CONSTRUCT_URL = "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct";

function resolveAppUrl(req: Request): string {
  return (
    req.headers.get("x-base44-app-url") ||
    Deno.env.get("WIX_CHECKOUT_APP_URL") ||
    ""
  );
}

export default async function(req: Request) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    const WIX_API_KEY = Deno.env.get("WIX_CHECKOUT_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_CHECKOUT_SITE_ID");
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("create-takeout-checkout: Wix payment config not set");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }
    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      console.error("create-takeout-checkout: no app URL");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || "").trim();
    if (!orderId) {
      return Response.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 400 });
    }
    if (order.order_type !== "takeout") {
      return Response.json({ error: "This order is not a takeout order" }, { status: 400 });
    }
    if (order.payment_status === "paid") {
      return Response.json({ error: "This order has already been paid." }, { status: 400 });
    }
    if (order.status !== "Pending Payment") {
      return Response.json({ error: "This order is no longer eligible for checkout." }, { status: 400 });
    }
    if (!order.items || order.items.length === 0) {
      return Response.json({ error: "Order has no items" }, { status: 400 });
    }

    // Build Wix cart items from the server-validated order items
    const cartItems = order.items.map((item: any) => ({
      name: String(item.name || "Menu Item"),
      quantity: Number(item.quantity) || 1,
      price: Number(item.unit_price || 0).toFixed(2),
    }));

    const total = order.items.reduce(
      (sum: number, item: any) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
      0
    );
    if (total < 0.5) {
      return Response.json({ error: "Order total must be at least $0.50" }, { status: 400 });
    }

    const productId = `takeout:${orderId}`;
    const productName = `Takeout Order — ${order.pickup_name || order.customer_name || "Guest"}`;

    // Capture buyer email if signed in
    let appUser = null;
    try { appUser = await base44.auth.me(); } catch (_) { appUser = null; }
    const customerInfo = appUser?.email ? { email: appUser.email } : null;

    const constructBody = {
      cart: {
        items: cartItems,
        ...(customerInfo ? { customerInfo } : {}),
      },
      callbackUrls: {
        thankYouPageUrl: `${appUrl}/ThankYou`,
        postFlowUrl: `${appUrl}/`,
      },
    };

    const wixRes = await fetch(CONSTRUCT_URL, {
      method: "POST",
      headers: {
        Authorization: WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(constructBody),
    });

    if (!wixRes.ok) {
      const errText = await wixRes.text();
      console.error("create-takeout-checkout: Wix construct failed", { status: wixRes.status, errText });
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId: string = checkoutSession?.id;
    const redirectUrl: string = checkoutSession?.redirectUrl;

    if (!checkoutSessionId || !redirectUrl) {
      console.error("create-takeout-checkout: missing checkoutSession id/redirectUrl", checkoutSession);
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }

    await base44.asServiceRole.entities.Base44Purchase.create({
      checkoutSessionId,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: appUser?.email ?? null,
      productId,
      productName,
      quantity: 1,
      amount: total.toFixed(2),
      currency: "USD",
    });

    return Response.json({ redirectUrl });
  } catch (err) {
    console.error("create-takeout-checkout: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}