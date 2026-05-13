import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [invoices, inventoryItems, menuItems, reservations] = await Promise.all([
      base44.asServiceRole.entities.Invoice.list('-created_date', 1000),
      base44.asServiceRole.entities.InventoryItem.list('name', 200),
      base44.asServiceRole.entities.MenuItem.list('name', 200),
      base44.asServiceRole.entities.Reservation.list('-date', 500),
    ]);

    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');

    // ── Helper: day-of-week name ─────────────────────────────────────────
    const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // ── Sales aggregation helpers ─────────────────────────────────────────
    const now = new Date();
    const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

    // Window: last 90 days bucketed by week
    const salesByWeek = {}; // week_number -> {itemName -> qty}
    const salesByDOW  = {}; // dayOfWeek  -> {itemName -> qty}

    for (const invoice of paidInvoices) {
      const iDate = new Date(invoice.created_date);
      const daysBack = Math.floor((now - iDate) / 86400000);
      if (daysBack > 90) continue;

      const weekNum = Math.floor(daysBack / 7); // 0 = current week
      const dow = iDate.getDay();

      for (const li of (invoice.items || [])) {
        if (!li.name) continue;
        const qty = li.quantity || 1;

        if (!salesByWeek[weekNum]) salesByWeek[weekNum] = {};
        salesByWeek[weekNum][li.name] = (salesByWeek[weekNum][li.name] || 0) + qty;

        if (!salesByDOW[dow]) salesByDOW[dow] = {};
        salesByDOW[dow][li.name] = (salesByDOW[dow][li.name] || 0) + qty;
      }
    }

    // ── Upcoming confirmed reservations (next 14 days) ────────────────────
    const upcomingGuests = {};
    for (let d = 0; d < 14; d++) {
      const target = new Date(now);
      target.setDate(target.getDate() + d);
      const dateStr = target.toISOString().split('T')[0];
      const dayRes = reservations.filter(r =>
        r.date === dateStr && (r.status === 'Confirmed' || r.status === 'Pending')
      );
      upcomingGuests[dateStr] = dayRes.reduce((sum, r) => sum + (r.party_size || 2), 0);
    }
    const totalUpcomingGuests = Object.values(upcomingGuests).reduce((a, b) => a + b, 0);

    // ── Menu item sales map ───────────────────────────────────────────────
    const menuItemSales30d = {};
    const menuItemSales60d = {};
    const menuItemSalesWeekly = {}; // week index -> sales

    for (const invoice of paidInvoices) {
      const daysBack = Math.floor((now - new Date(invoice.created_date)) / 86400000);
      for (const li of (invoice.items || [])) {
        if (!li.name) continue;
        const qty = li.quantity || 1;
        if (daysBack <= 30) menuItemSales30d[li.name] = (menuItemSales30d[li.name] || 0) + qty;
        if (daysBack <= 60) menuItemSales60d[li.name] = (menuItemSales60d[li.name] || 0) + qty;
        const wk = Math.floor(daysBack / 7);
        if (wk <= 12) {
          if (!menuItemSalesWeekly[li.name]) menuItemSalesWeekly[li.name] = {};
          menuItemSalesWeekly[li.name][wk] = (menuItemSalesWeekly[li.name][wk] || 0) + qty;
        }
      }
    }

    // ── Trend: compare last 30d vs previous 30d ───────────────────────────
    const trendFor = (name) => {
      const r30 = menuItemSales30d[name] || 0;
      const prev30 = Math.max(1, (menuItemSales60d[name] || 0) - r30);
      const change = ((r30 - prev30) / prev30) * 100;
      if (change > 15) return 'rising';
      if (change < -15) return 'falling';
      return 'stable';
    };

    // ── Seasonality: peak days of week ───────────────────────────────────
    const peakDaysFor = (name) => {
      const dowSales = Object.entries(salesByDOW)
        .map(([dow, items]) => ({ dow: parseInt(dow), qty: items[name] || 0 }))
        .filter(x => x.qty > 0)
        .sort((a, b) => b.qty - a.qty);
      return dowSales.slice(0, 2).map(x => DOW[x.dow]);
    };

    // ── Build forecast per inventory item ─────────────────────────────────
    const menuMap = Object.fromEntries(menuItems.map(m => [m.id, m]));

    const forecastResults = inventoryItems.map(item => {
      const linkedIds = item.linked_menu_items || [];

      // Aggregate demand from linked menu items
      let totalSales30d = 0;
      let totalSales60d = 0;
      let trend = 'stable';
      const peakDays = new Set();
      const weeklyTotals = {};

      for (const mid of linkedIds) {
        const mi = menuMap[mid];
        if (!mi) continue;
        totalSales30d += menuItemSales30d[mi.name] || 0;
        totalSales60d += menuItemSales60d[mi.name] || 0;
        const t = trendFor(mi.name);
        if (t === 'rising') trend = 'rising';
        else if (t === 'falling' && trend !== 'rising') trend = 'falling';
        peakDaysFor(mi.name).forEach(d => peakDays.add(d));

        // weekly breakdown
        const wkData = menuItemSalesWeekly[mi.name] || {};
        for (const [wk, qty] of Object.entries(wkData)) {
          weeklyTotals[wk] = (weeklyTotals[wk] || 0) + qty;
        }
      }

      // If no linked items, just use static stock checks
      const hasData = linkedIds.length > 0 && totalSales30d > 0;

      const dailyDemand = hasData ? totalSales30d / 30 : 0;

      // Apply trend multiplier
      const trendMultiplier = trend === 'rising' ? 1.2 : trend === 'falling' ? 0.85 : 1.0;
      const adjustedDailyDemand = dailyDemand * trendMultiplier;

      // Forecast periods
      const forecast7d  = Math.ceil(adjustedDailyDemand * 7);
      const forecast14d = Math.ceil(adjustedDailyDemand * 14);
      const forecast30d = Math.ceil(adjustedDailyDemand * 30);

      // Days of stock remaining
      const daysRemaining = adjustedDailyDemand > 0
        ? Math.floor(item.current_stock / adjustedDailyDemand)
        : null;

      // Optimal stock level: 14 days of adjusted demand + safety buffer (20%)
      const optimalStock = Math.ceil(adjustedDailyDemand * 14 * 1.2);

      // Reorder alert: if stock will run out before next typical delivery (7 days)
      const needsReorder = item.current_stock < forecast7d || item.current_stock <= item.min_stock_level;
      const suggestedReorderQty = needsReorder
        ? Math.max(item.reorder_quantity || 0, optimalStock - item.current_stock)
        : 0;

      // Stock status
      let status = 'OK';
      if (item.current_stock <= 0) status = 'Out of Stock';
      else if (item.current_stock <= item.min_stock_level) status = 'Low Stock';
      else if (needsReorder) status = 'Reorder Soon';

      // Weekly sparkline data (last 8 weeks)
      const sparkline = Array.from({ length: 8 }, (_, i) => ({
        week: `W-${7 - i}`,
        demand: weeklyTotals[7 - i] || 0,
      })).reverse();

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
        linked_item_count: linkedIds.length,
        total_sales_last_30d: totalSales30d,
        daily_demand_estimate: Math.round(adjustedDailyDemand * 100) / 100,
        forecast_7d: forecast7d,
        forecast_14d: forecast14d,
        forecast_30d: forecast30d,
        days_of_stock_remaining: daysRemaining,
        optimal_stock_level: optimalStock,
        needs_reorder: needsReorder,
        suggested_reorder_qty: suggestedReorderQty,
        trend,
        peak_days: Array.from(peakDays),
        sparkline,
        status,
        has_data: hasData,
      };
    });

    // Sort by urgency
    const urgencyOrder = { 'Out of Stock': 0, 'Low Stock': 1, 'Reorder Soon': 2, 'OK': 3 };
    forecastResults.sort((a, b) => urgencyOrder[a.status] - urgencyOrder[b.status]);

    // ── Reorder alerts ────────────────────────────────────────────────────
    const reorderAlerts = forecastResults
      .filter(i => i.needs_reorder)
      .map(i => ({
        id: i.id,
        name: i.name,
        status: i.status,
        current_stock: i.current_stock,
        unit: i.unit,
        days_remaining: i.days_of_stock_remaining,
        suggested_reorder_qty: i.suggested_reorder_qty,
        supplier: i.supplier,
        estimated_cost: Math.round(i.suggested_reorder_qty * (i.cost_per_unit || 0) * 100) / 100,
        trend: i.trend,
      }));

    // ── Summary stats ─────────────────────────────────────────────────────
    const summary = {
      total_items: forecastResults.length,
      out_of_stock: forecastResults.filter(i => i.status === 'Out of Stock').length,
      low_stock: forecastResults.filter(i => i.status === 'Low Stock').length,
      reorder_soon: forecastResults.filter(i => i.status === 'Reorder Soon').length,
      ok: forecastResults.filter(i => i.status === 'OK').length,
      invoices_analyzed: paidInvoices.length,
      period_days: 90,
      total_reorder_cost: reorderAlerts.reduce((sum, a) => sum + (a.estimated_cost || 0), 0),
      upcoming_guests_14d: totalUpcomingGuests,
      items_with_rising_trend: forecastResults.filter(i => i.trend === 'rising').length,
      items_with_falling_trend: forecastResults.filter(i => i.trend === 'falling').length,
    };

    return Response.json({ summary, forecast: forecastResults, reorder_alerts: reorderAlerts });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});