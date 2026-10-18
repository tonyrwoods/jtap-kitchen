import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { reportPeriod, reportRows, syncReportRows, summarizeReport } from "../../shared/revenueReport.js";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Administrator access is required to view revenue reports." }, { status: 403 });
    const { range = "month" } = await req.json();
    if (!["week", "month", "year"].includes(range)) return Response.json({ error: "Choose week, month, or year." }, { status: 400 });
    const period = reportPeriod(range);
    const reportId = crypto.randomUUID();
    const rowsEntity = base44.entities.RevenueReportRow;
    let hasRows = false;
    try {
      // A private, request-specific reporting snapshot avoids stale caches and concurrent
      // reports interfering with one another. Only derived rows are written, never sales.
      // Stream each source through the snapshot; there is no 100/500-record report cap.
      const dates = { $gte: period.start, $lt: period.end };
      let cursor;
      do {
        const page = await base44.entities.Invoice.filter(
          { status: "Paid", is_vendor_invoice: { $ne: true }, created_date: dates },
          { sort: "created_date", limit: 100, cursor, fields: ["created_date", "items", "total", "tax_amount", "server_name"] }
        );
        const rows = page.items.flatMap(invoice => reportRows("invoice", invoice, reportId));
        if (rows.length) { hasRows = true; await syncReportRows(rowsEntity, rows); }
        cursor = page.has_more ? page.next_cursor : null;
      } while (cursor);

      cursor = undefined;
      do {
        const page = await base44.entities.Order.filter(
          { payment_status: "paid", status: { $nin: ["Pending Payment", "Cancelled", "Voided"] }, created_date: dates },
          { sort: "created_date", limit: 100, cursor, fields: ["created_date", "items", "server_name"] }
        );
        // Match receipts across ALL dates, not just this reporting period. A linked
        // order must never reappear as extra revenue when its receipt is out of range.
        const ids = page.items.map(order => order.id);
        const receiptLinks = ids.length ? await base44.entities.Invoice.filter(
          { order_id: { $in: ids }, status: { $in: ["Paid", "Voided"] }, is_vendor_invoice: { $ne: true } },
          { distinct: "order_id", limit: 100 }
        ) : { items: [] };
        const linkedOrders = new Set(receiptLinks.items);
        const rows = page.items.flatMap(order => linkedOrders.has(order.id) ? [] : reportRows("order", order, reportId));
        if (rows.length) { hasRows = true; await syncReportRows(rowsEntity, rows); }
        cursor = page.has_more ? page.next_cursor : null;
      } while (cursor);

      // Database aggregation computes every metric from the same recognized sales.
      // Integer cents prevent numeric-string concatenation and floating-point drift.
      const transactionQuery = { report_id: reportId, row_type: "transaction" };
      const [daily, servers, items] = await Promise.all([
        rowsEntity.aggregate({ query: transactionQuery, groupBy: "business_day", sum: ["revenue_cents", "tax_cents", "transaction_count"], limit: 366 }),
        rowsEntity.aggregate({ query: transactionQuery, groupBy: "server_name", sum: "revenue_cents", sort: "-sum_revenue_cents", limit: 1000 }),
        rowsEntity.aggregate({ query: { report_id: reportId, row_type: "item", quantity: { $gt: 0 } }, groupBy: "item_name", sum: "quantity", sort: "-sum_quantity", limit: 5 }),
      ]);
      if (daily.truncated || servers.truncated) throw new Error("The revenue report exceeded its grouping limit. No partial totals were returned.");
      return Response.json(summarizeReport(period, daily.rows, servers.rows, items.rows));
    } finally {
      if (hasRows) await rowsEntity.deleteMany({ report_id: reportId });
    }
  } catch (error) {
    console.error("getRevenueAnalytics failed:", error);
    return Response.json({ error: error.message || "Unable to calculate revenue." }, { status: 500 });
  }
}