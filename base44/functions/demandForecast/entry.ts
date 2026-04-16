import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoices (sales history) and inventory items
    const [invoices, inventoryItems, menuItems] = await Promise.all([
      base44.asServiceRole.entities.Invoice.list('-created_date', 500),
      base44.asServiceRole.entities.InventoryItem.list('name', 200),
      base44.asServiceRole.entities.MenuItem.list('name', 200),
    ]);

    // --- Step 1: Aggregate sales per menu item over the last 30 days ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = invoices.filter(inv =>
      inv.status === 'Paid' && new Date(inv.created_date) >= thirtyDaysAgo
    );

    // Count quantity sold per menu item name
    const salesCount = {};
    for (const invoice of recentInvoices) {
      for (const lineItem of (invoice.items || [])) {
        const key = lineItem.name;
        if (!key) continue;
        salesCount[key] = (salesCount[key] || 0) + (lineItem.quantity || 1);
      }
    }

    // --- Step 2: Build a map of menuItemId -> sales count ---
    const menuItemSales = {};
    for (const mi of menuItems) {
      menuItemSales[mi.id] = salesCount[mi.name] || 0;
    }

    // --- Step 3: For each inventory item, estimate demand based on linked menu items ---
    const forecastResults = inventoryItems.map(item => {
      const linkedIds = item.linked_menu_items || [];

      // Sum up sales of all linked menu items as a proxy for ingredient demand
      const totalLinkedSales = linkedIds.reduce((sum, id) => sum + (menuItemSales[id] || 0), 0);

      // Daily demand estimate (over 30 days)
      const dailyDemand = totalLinkedSales / 30;

      // Forecast for next 7 and 14 days
      const forecast7d = Math.ceil(dailyDemand * 7);
      const forecast14d = Math.ceil(dailyDemand * 14);

      // Determine stock status
      let status = 'OK';
      if (item.current_stock <= 0) {
        status = 'Out of Stock';
      } else if (item.current_stock <= item.min_stock_level) {
        status = 'Low Stock';
      } else if (forecast7d >= item.current_stock) {
        status = 'Reorder Soon';
      }

      // Days of stock remaining
      const daysRemaining = dailyDemand > 0
        ? Math.floor(item.current_stock / dailyDemand)
        : null;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        current_stock: item.current_stock,
        min_stock_level: item.min_stock_level,
        reorder_quantity: item.reorder_quantity,
        cost_per_unit: item.cost_per_unit,
        supplier: item.supplier,
        expiry_date: item.expiry_date,
        linked_menu_items: linkedIds,
        total_sales_last_30d: totalLinkedSales,
        daily_demand_estimate: Math.round(dailyDemand * 100) / 100,
        forecast_7d: forecast7d,
        forecast_14d: forecast14d,
        days_of_stock_remaining: daysRemaining,
        status,
      };
    });

    // Sort by urgency: Out of Stock > Low Stock > Reorder Soon > OK
    const urgencyOrder = { 'Out of Stock': 0, 'Low Stock': 1, 'Reorder Soon': 2, 'OK': 3 };
    forecastResults.sort((a, b) => urgencyOrder[a.status] - urgencyOrder[b.status]);

    // --- Step 4: Summary stats ---
    const summary = {
      total_items: forecastResults.length,
      out_of_stock: forecastResults.filter(i => i.status === 'Out of Stock').length,
      low_stock: forecastResults.filter(i => i.status === 'Low Stock').length,
      reorder_soon: forecastResults.filter(i => i.status === 'Reorder Soon').length,
      ok: forecastResults.filter(i => i.status === 'OK').length,
      invoices_analyzed: recentInvoices.length,
      period_days: 30,
    };

    return Response.json({ summary, forecast: forecastResults });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});