import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShoppingCart,
  ChevronDown, ChevronUp, Sparkles, Bell, Package, Calendar,
  DollarSign, BarChart2
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const TREND_CONFIG = {
  rising:  { icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50  border-green-200",  label: "Rising"  },
  falling: { icon: TrendingDown, color: "text-red-500",    bg: "bg-red-50    border-red-200",    label: "Falling" },
  stable:  { icon: Minus,        color: "text-blue-500",   bg: "bg-blue-50   border-blue-200",   label: "Stable"  },
};

const STATUS_COLORS = {
  "Out of Stock": "bg-red-100 text-red-800 border-red-300",
  "Low Stock":    "bg-orange-100 text-orange-800 border-orange-300",
  "Reorder Soon": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "OK":           "bg-green-100 text-green-800 border-green-300",
};

function TrendBadge({ trend }) {
  const cfg = TREND_CONFIG[trend] || TREND_CONFIG.stable;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function Sparkline({ data }) {
  const max = Math.max(...data.map(d => d.demand), 1);
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="demand" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={i === data.length - 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Reorder Alerts Panel ──────────────────────────────────────────────────────
function ReorderAlertsPanel({ alerts, summary }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-amber-50/50">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-semibold text-amber-900">
            {alerts.length} Automated Reorder Alert{alerts.length !== 1 ? "s" : ""}
          </p>
          <p className="font-body text-xs text-amber-700">
            Estimated reorder cost: ${(summary?.total_reorder_cost || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {alerts.map((alert) => (
          <div key={alert.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-body text-sm font-semibold">{alert.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[alert.status] || ""}`}>
                  {alert.status}
                </span>
                <TrendBadge trend={alert.trend} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-body text-xs text-muted-foreground">
                  Stock: <strong>{alert.current_stock} {alert.unit}</strong>
                  {alert.days_remaining != null && ` · ${alert.days_remaining}d remaining`}
                </p>
                {alert.supplier && (
                  <p className="font-body text-xs text-muted-foreground">Supplier: {alert.supplier}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-body text-xs text-muted-foreground mb-0.5">Suggested order</p>
              <p className="font-heading text-base font-bold text-primary">
                {alert.suggested_reorder_qty} {alert.unit}
              </p>
              {alert.estimated_cost > 0 && (
                <p className="font-body text-xs text-muted-foreground">${alert.estimated_cost.toFixed(2)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Forecast Summary Cards ────────────────────────────────────────────────────
function ForecastSummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      icon: Package,
      label: "Upcoming Guests (14d)",
      value: summary.upcoming_guests_14d || 0,
      sub: "confirmed + pending",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: TrendingUp,
      label: "Rising Demand",
      value: summary.items_with_rising_trend || 0,
      sub: "items trending up",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: TrendingDown,
      label: "Falling Demand",
      value: summary.items_with_falling_trend || 0,
      sub: "items trending down",
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      icon: DollarSign,
      label: "Est. Reorder Cost",
      value: `$${(summary.total_reorder_cost || 0).toFixed(0)}`,
      sub: "to restock alerts",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="font-heading text-xl font-bold">{value}</p>
            <p className="font-body text-xs text-muted-foreground leading-tight">{label}</p>
            <p className="font-body text-xs text-muted-foreground/70">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Individual Item Forecast Row ──────────────────────────────────────────────
function ForecastRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  const stockPct = item.optimal_stock_level > 0
    ? Math.min(100, (item.current_stock / item.optimal_stock_level) * 100)
    : 100;
  const barColor = stockPct < 25 ? "bg-red-500" : stockPct < 50 ? "bg-orange-400" : stockPct < 75 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className={`border-b border-border last:border-0 ${item.needs_reorder ? "bg-amber-50/30" : ""}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-body text-sm font-semibold">{item.name}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[item.status] || ""}`}>
                {item.status}
              </span>
              {item.has_data && <TrendBadge trend={item.trend} />}
            </div>
            {/* Stock bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 max-w-[140px] h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${stockPct}%` }} />
              </div>
              <p className="font-body text-xs text-muted-foreground shrink-0">
                {item.current_stock}/{item.optimal_stock_level || "—"} {item.unit}
              </p>
            </div>
          </div>

          {/* Sparkline */}
          {item.has_data && item.sparkline?.length > 0 && (
            <div className="hidden sm:block">
              <Sparkline data={item.sparkline} />
            </div>
          )}

          {/* 7d Forecast */}
          <div className="text-right shrink-0 hidden md:block">
            <p className="font-body text-xs text-muted-foreground">7d demand</p>
            <p className="font-heading text-sm font-bold">{item.forecast_7d > 0 ? `${item.forecast_7d} ${item.unit}` : "—"}</p>
          </div>

          {/* Days remaining */}
          <div className="text-right shrink-0">
            <p className="font-body text-xs text-muted-foreground">Days left</p>
            <p className={`font-heading text-sm font-bold ${item.days_of_stock_remaining != null && item.days_of_stock_remaining < 7 ? "text-red-600" : ""}`}>
              {item.days_of_stock_remaining != null ? item.days_of_stock_remaining : "∞"}
            </p>
          </div>

          <div className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "7-Day Forecast",  value: `${item.forecast_7d} ${item.unit}` },
                { label: "14-Day Forecast", value: `${item.forecast_14d} ${item.unit}` },
                { label: "30-Day Forecast", value: `${item.forecast_30d} ${item.unit}` },
                { label: "Optimal Stock",   value: item.optimal_stock_level > 0 ? `${item.optimal_stock_level} ${item.unit}` : "—" },
                { label: "Daily Demand",    value: item.daily_demand_estimate > 0 ? `${item.daily_demand_estimate} ${item.unit}/day` : "Not tracked" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3">
                  <p className="font-body text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-body text-sm font-semibold">{value}</p>
                </div>
              ))}

              {item.peak_days?.length > 0 && (
                <div className="bg-muted/40 rounded-xl p-3 sm:col-span-2">
                  <p className="font-body text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Peak Days
                  </p>
                  <p className="font-body text-sm font-semibold">{item.peak_days.join(", ")}</p>
                </div>
              )}

              {item.needs_reorder && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:col-span-2">
                  <p className="font-body text-xs text-amber-700 mb-0.5 flex items-center gap-1 font-semibold">
                    <ShoppingCart className="w-3 h-3" /> Reorder Suggestion
                  </p>
                  <p className="font-body text-sm font-bold text-amber-900">
                    {item.suggested_reorder_qty} {item.unit}
                    {item.cost_per_unit > 0 && ` · Est. $${(item.suggested_reorder_qty * item.cost_per_unit).toFixed(2)}`}
                  </p>
                  {item.supplier && <p className="font-body text-xs text-amber-700 mt-0.5">From: {item.supplier}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIForecastingPanel({ forecast, reorderAlerts, summary, loading }) {
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("urgency");

  const FILTERS = ["All", "Reorder Needed", "Rising Trend", "Falling Trend", "Expiring Soon"];

  const now = new Date();

  const filtered = (forecast || []).filter(item => {
    if (filter === "Reorder Needed") return item.needs_reorder;
    if (filter === "Rising Trend") return item.trend === "rising";
    if (filter === "Falling Trend") return item.trend === "falling";
    if (filter === "Expiring Soon") {
      if (!item.expiry_date) return false;
      const days = Math.floor((new Date(item.expiry_date) - now) / 86400000);
      return days >= 0 && days <= 7;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "urgency") {
      const order = { "Out of Stock": 0, "Low Stock": 1, "Reorder Soon": 2, "OK": 3 };
      return (order[a.status] || 3) - (order[b.status] || 3);
    }
    if (sortBy === "days_remaining") {
      const da = a.days_of_stock_remaining ?? 9999;
      const db = b.days_of_stock_remaining ?? 9999;
      return da - db;
    }
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold">AI Inventory Forecasting</h3>
          <p className="font-body text-xs text-muted-foreground">
            Trend analysis · Seasonality · Optimal stock levels · {summary?.invoices_analyzed || 0} invoices analyzed
          </p>
        </div>
      </div>

      {/* Forecast Summary Cards */}
      <ForecastSummaryCards summary={summary} />

      {/* Reorder Alerts */}
      <ReorderAlertsPanel alerts={reorderAlerts} summary={summary} />

      {/* Forecast Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/30 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <p className="font-body text-sm font-semibold">Item Forecasts</p>
            <span className="font-body text-xs text-muted-foreground">({sorted.length} items)</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full font-body text-xs font-medium border transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-border rounded-lg px-2 py-1 text-xs bg-background font-body"
            >
              <option value="urgency">Sort: Urgency</option>
              <option value="days_remaining">Sort: Days Left</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-14">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">No items match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map(item => <ForecastRow key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}