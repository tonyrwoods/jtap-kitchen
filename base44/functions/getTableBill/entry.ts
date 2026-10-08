// Public endpoint: returns all unpaid orders for a table so a guest
// can view their bill and pay from their phone via QR code.
// Uses service role since Order RLS restricts reads to staff/admin.
// Returns only the data needed to display a bill — no sensitive fields.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

export default async function(req: Request) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const tableNumber = Number(body.table_number);

    if (!Number.isFinite(tableNumber) || tableNumber < 1 || tableNumber > 999) {
      return Response.json({ error: "A valid table number is required" }, { status: 400 });
    }

    const page = await base44.asServiceRole.entities.Order.filter(
      { table_number: tableNumber, payment_status: "unpaid" },
      { sort: "-created_date", limit: 100 }
    );
    const orders = page.items || [];

    // Build itemized bill from all unpaid orders at this table
    const lineItems: any[] = [];
    let subtotal = 0;
    for (const order of orders) {
      for (const item of (order.items || [])) {
        const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
        lineItems.push({
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          line_total: lineTotal,
          order_id: order.id,
        });
        subtotal += lineTotal;
      }
    }

    // Fetch tax rate from AppSettings
    let taxRate = 9.25;
    try {
      const settingsPage = await base44.asServiceRole.entities.AppSettings.filter({}, { limit: 1 });
      const settings = settingsPage.items?.[0] || settingsPage[0];
      if (settings?.tax_rate) taxRate = Number(settings.tax_rate);
    } catch (_) {}

    return Response.json({
      table_number: tableNumber,
      items: lineItems,
      subtotal: subtotal,
      tax_rate: taxRate,
      order_count: orders.length,
    });
  } catch (err) {
    console.error("getTableBill error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}