import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public endpoint: lets a guest at a table place a menu order from the
// Digital Menu (table QR). Creates an Order as the service role since the
// Order entity's RLS restricts create to staff/admin. Validates every
// menu item and its price server-side — never trusts client-supplied prices.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { table_number, items, customer_name, notes } = body;

    // ── Validate table number ──
    const tableNum = Number(table_number);
    if (!Number.isFinite(tableNum) || tableNum < 1 || tableNum > 999) {
      return Response.json({ error: 'A valid table number is required' }, { status: 400 });
    }

    // ── Validate items array ──
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'At least one item is required' }, { status: 400 });
    }
    if (items.length > 50) {
      return Response.json({ error: 'Too many items in a single order' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.menu_item_id || typeof item.menu_item_id !== 'string') {
        return Response.json({ error: 'Invalid item in order' }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 30) {
        return Response.json({ error: 'Invalid quantity for an item' }, { status: 400 });
      }
    }

    // ── Fetch menu items server-side to get authoritative prices & names ──
    const menuItemIds = items.map(i => i.menu_item_id);
    const menuResults = await base44.asServiceRole.entities.MenuItem.filter(
      { id: { $in: menuItemIds } },
      { limit: 100 }
    );
    const menuPage = menuResults.items || menuResults;
    const menuMap = new Map(menuPage.map(m => [m.id, m]));

    // ── Build order items with server-validated data ──
    const orderItems = [];
    for (const item of items) {
      const menuItem = menuMap.get(item.menu_item_id);
      if (!menuItem) continue; // skip any item that no longer exists
      orderItems.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: Number(item.quantity),
        unit_price: Number(menuItem.price) || 0,
        notes: String(item.notes || '').slice(0, 200),
      });
    }

    if (orderItems.length === 0) {
      return Response.json({ error: 'No valid menu items found' }, { status: 400 });
    }

    // ── Create the order ──
    const order = await base44.asServiceRole.entities.Order.create({
      table_number: tableNum,
      items: orderItems,
      status: 'New',
      priority: 'Normal',
      customer_name: String(customer_name || '').slice(0, 100),
      notes: String(notes || '').slice(0, 500),
    });

    return Response.json({ success: true, order_id: order.id, table_number: tableNum });
  } catch (error) {
    console.error('submitMenuOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}