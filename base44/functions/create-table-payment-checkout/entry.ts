// Pay-at-table checkout — Wix Payments (Base44 Payments).
// Public (no auth gate): a guest at a table need not be logged in to pay.
// Looks up all unpaid orders at the table SERVER-SIDE, builds a single
// Wix cart line for the total, and returns { redirectUrl }.
// Correlation: productId "tablepayment:{tableNumber}" on the Base44Purchase;
// the webhook marks all unpaid orders at that table as paid.

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
      console.error("create-table-payment-checkout: Wix payment config not set");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }
    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      console.error("create-table-payment-checkout: no app URL");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const tableNumber = Number(body.table_number);
    const tipAmount = Math.max(0, Number(body.tip_amount) || 0);

    if (!Number.isFinite(tableNumber) || tableNumber < 1 || tableNumber > 999) {
      return Response.json({ error: "A valid table number is required" }, { status: 400 });
    }

    // Fetch all unpaid orders at this table
    const page = await base44.asServiceRole.entities.Order.filter(
      { table_number: tableNumber, payment_status: "unpaid" },
      { sort: "-created_date", limit: 100 }
    );
    const orders = page.items || [];

    if (orders.length === 0) {
      return Response.json({ error: "No unpaid orders found for this table." }, { status: 400 });
    }

    // Calculate subtotal from all unpaid orders
    let subtotal = 0;
    for (const order of orders) {
      for (const item of (order.items || [])) {
        subtotal += (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
      }
    }

    // Fetch tax rate from AppSettings
    let taxRate = 9.25;
    try {
      const settingsPage = await base44.asServiceRole.entities.AppSettings.filter({}, { limit: 1 });
      const settings = settingsPage.items?.[0] || settingsPage[0];
      if (settings?.tax_rate) taxRate = Number(settings.tax_rate);
    } catch (_) {}

    const taxAmount = subtotal * taxRate / 100;
    const total = subtotal + taxAmount + tipAmount;

    if (total < 0.5) {
      return Response.json({ error: "Bill total must be at least $0.50" }, { status: 400 });
    }

    const productId = `tablepayment:${tableNumber}`;
    const productName = tipAmount > 0
      ? `Table ${tableNumber} Payment (incl. $${tipAmount.toFixed(2)} tip)`
      : `Table ${tableNumber} Payment`;

    let appUser = null;
    try { appUser = await base44.auth.me(); } catch (_) { appUser = null; }
    const customerInfo = appUser?.email ? { email: appUser.email } : null;

    const constructBody = {
      cart: {
        items: [{ name: productName, quantity: 1, price: total.toFixed(2) }],
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
      console.error("create-table-payment-checkout: Wix construct failed", { status: wixRes.status, errText });
      return Response.json({ error: "Could not start checkout" }, { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId: string = checkoutSession?.id;
    const redirectUrl: string = checkoutSession?.redirectUrl;

    if (!checkoutSessionId || !redirectUrl) {
      console.error("create-table-payment-checkout: missing checkoutSession id/redirectUrl", checkoutSession);
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
    console.error("create-table-payment-checkout: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}