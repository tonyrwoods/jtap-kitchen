const TIME_ZONE = "America/Chicago";
const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export function businessDay(value) {
  // Base44's older timestamps omit the UTC suffix; they are not restaurant-local times.
  const timestamp = typeof value === "string" && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? `${value}Z` : value;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) throw new Error("A sale has an invalid recorded date.");
  const parts = Object.fromEntries(dayFormatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDay(day, offset) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function localMidnight(day) {
  const target = Date.parse(`${day}T00:00:00Z`);
  let time = target;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(formatter.formatToParts(new Date(time)).map(part => [part.type, part.value]));
    const displayed = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    time += target - displayed;
  }
  return new Date(time).toISOString();
}

export function reportPeriod(range, now = new Date()) {
  if (!["week", "month", "year"].includes(range)) throw new Error("Choose week, month, or year.");
  const today = businessDay(now);
  const startDay = range === "year" ? `${today.slice(0, 4)}-01-01` : shiftDay(today, range === "week" ? -6 : -29);
  const days = [];
  for (let day = startDay; day <= today; day = shiftDay(day, 1)) days.push(day);
  return { startDay, days, start: localMidnight(startDay), end: now.toISOString(), timeZone: TIME_ZONE, label: { week: "Last 7 Days", month: "Last 30 Days", year: "Year to Date" }[range] };
}

function numeric(value, label) {
  const number = value === undefined || value === null || value === "" ? 0 : Number(value);
  if (!Number.isFinite(number)) throw new Error(`A sale has an invalid ${label}.`);
  return number;
}

function cents(value, label) {
  const number = numeric(value, label);
  return Math.round((number + Math.sign(number) * Number.EPSILON) * 100);
}

export function reportRows(source, record, reportId) {
  const items = Array.isArray(record.items) ? record.items : [];
  const key = `${source}:${record.id}`;
  const common = { report_id: reportId, business_day: businessDay(record.created_date), server_name: String(record.server_name || "").trim() || "Unassigned" };
  const tax = cents(record.tax_amount, "tax amount");
  const total = source === "invoice"
    // Receipt total already includes its discount. Never subtract the discount twice.
    ? cents(record.total, "receipt total") - tax
    : items.reduce((sum, item) => sum + cents(numeric(item.unit_price, "unit price") * numeric(item.quantity, "quantity"), "line total"), 0) - cents(record.discount_amount, "discount amount");
  return [
    { ...common, row_key: `${key}:transaction`, row_type: "transaction", revenue_cents: total, tax_cents: tax, transaction_count: 1 },
    ...items.map((item, index) => ({ ...common, row_key: `${key}:item:${index}`, row_type: "item", item_name: String(item.name || "Unnamed item"), quantity: numeric(item.quantity, "quantity"), revenue_cents: 0, tax_cents: 0, transaction_count: 0 })),
  ];
}

export async function syncReportRows(entity, rows) {
  // Flatten nested sale lines for database aggregation without changing invoices or orders.
  for (let index = 0; index < rows.length; index += 500) {
    await entity.upsert(rows.slice(index, index + 500), { key: ["report_id", "row_key"] });
  }
}

export function summarizeReport(period, dailyRows, serverRows, itemRows) {
  const days = new Map(dailyRows.map(row => [row.business_day, row]));
  const totals = dailyRows.reduce((sum, row) => ({ revenue: sum.revenue + Number(row.sum_revenue_cents || 0), tax: sum.tax + Number(row.sum_tax_cents || 0), transactions: sum.transactions + Number(row.sum_transaction_count || 0) }), { revenue: 0, tax: 0, transactions: 0 });
  return {
    totalRevenue: totals.revenue / 100,
    taxCollected: totals.tax / 100,
    transactions: totals.transactions,
    avgCheckSize: totals.transactions ? totals.revenue / 100 / totals.transactions : 0,
    dailyRevenue: period.days.map(day => ({ date: new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: period.timeZone, month: "short", day: "numeric" }), revenue: Number(days.get(day)?.sum_revenue_cents || 0) / 100 })),
    serverData: serverRows.map(row => ({ name: row.server_name, revenue: Number(row.sum_revenue_cents || 0) / 100 })),
    topItems: itemRows.map(row => ({ name: row.item_name, count: Number(row.sum_quantity || 0) })),
    periodLabel: period.label,
    timeZone: period.timeZone,
  };
}