import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all invoices and price history
    const invoices = await base44.entities.Invoice.list();
    const priceHistory = await base44.entities.VendorPriceHistory.list();

    const alerts = [];
    const priceIndex = {};

    // Build price index by vendor and item
    priceHistory.forEach(record => {
      const key = `${record.vendor_name}|${record.item_name}`;
      if (!priceIndex[key]) {
        priceIndex[key] = [];
      }
      priceIndex[key].push({
        price: record.unit_price,
        date: record.purchase_date,
        vendor: record.vendor_name
      });
    });

    // Analyze each invoice
    for (const invoice of invoices) {
      if (!invoice.items || !Array.isArray(invoice.items)) continue;

      for (const item of invoice.items) {
        const key = `${invoice.vendor_name}|${item.name}`;
        const historicalPrices = priceIndex[key] || [];

        if (historicalPrices.length === 0) continue;

        // Calculate historical average
        const avgPrice = historicalPrices.reduce((sum, p) => sum + p.price, 0) / historicalPrices.length;
        const variance = ((item.unit_price - avgPrice) / avgPrice) * 100;

        // Determine severity
        let severity = null;
        if (Math.abs(variance) >= THRESHOLDS.HIGH_VARIANCE) {
          severity = 'high';
        } else if (Math.abs(variance) >= THRESHOLDS.MEDIUM_VARIANCE) {
          severity = 'medium';
        } else if (Math.abs(variance) >= THRESHOLDS.LOW_VARIANCE) {
          severity = 'low';
        }

        if (severity && variance > 0) {
          const overchargeAmount = (item.unit_price - avgPrice) * item.quantity;
          
          alerts.push({
            id: `${invoice.id}-${item.name}-${Date.now()}`,
            invoice_id: invoice.id,
            vendor_name: invoice.vendor_name,
            item_name: item.name,
            category: invoice.expense_category || 'Other',
            invoice_price: item.unit_price,
            historical_avg: avgPrice,
            variance_percent: variance,
            overcharge_amount: overchargeAmount,
            purchase_date: invoice.created_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            severity,
            reason: `Price is ${variance.toFixed(1)}% above historical average of $${avgPrice.toFixed(2)}`
          });
        }
      }
    }

    // Sort by severity and overcharge amount
    const severityOrder = { high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.overcharge_amount - a.overcharge_amount;
    });

    return Response.json({ 
      alerts,
      analyzedInvoices: invoices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

const THRESHOLDS = {
  HIGH_VARIANCE: 20,
  MEDIUM_VARIANCE: 10,
  LOW_VARIANCE: 5
};