import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, ZAxis
} from "recharts";
import { TrendingUp, Star, HelpCircle, TrendingDown, Zap, Pencil, Check, X, DollarSign, Filter } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["All", "Starters", "Mains", "Desserts", "Drinks"];

// Quadrant definitions based on median splits
const QUADRANTS = {
  star:    { label: "⭐ Star",    desc: "High margin · High popularity",  color: "#22c55e", bg: "bg-green-50 border-green-200 text-green-800" },
  horse:   { label: "🐴 Workhorse", desc: "Low margin · High popularity", color: "#3b82f6", bg: "bg-blue-50 border-blue-200 text-blue-800" },
  puzzle:  { label: "🧩 Puzzle",  desc: "High margin · Low popularity",   color: "#f59e0b", bg: "bg-amber-50 border-amber-200 text-amber-800" },
  dog:     { label: "🐶 Dog",     desc: "Low margin · Low popularity",    color: "#ef4444", bg: "bg-red-50 border-red-200 text-red-800" },
};

function getQuadrant(margin, popularity, medMargin, medPop) {
  const highMargin = margin >= medMargin;
  const highPop    = popularity >= medPop;
  if (highMargin && highPop)   return "star";
  if (!highMargin && highPop)  return "horse";
  if (highMargin && !highPop)  return "puzzle";
  return "dog";
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ── Inline editable price/cost cell ──────────────────────────────────────────
function EditableCell({ value, prefix = "$", onSave, placeholder = "—" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");

  const commit = async () => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) { toast.error("Enter a valid number"); return; }
    await onSave(num);
    setEditing(false);
  };

  if (editing) return (
    <div className="flex items-center gap-1">
      <span className="font-body text-xs text-muted-foreground">{prefix}</span>
      <input
        autoFocus
        type="number" min="0" step="0.01"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="w-20 border border-primary rounded px-1.5 py-0.5 text-sm bg-background font-body"
      />
      <button onClick={commit} className="text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <button
      onClick={() => { setVal(value ?? ""); setEditing(true); }}
      className="flex items-center gap-1 group font-body text-sm hover:text-primary transition-colors"
    >
      {value != null ? <><span className="text-muted-foreground text-xs">{prefix}</span>{Number(value).toFixed(2)}</> : <span className="text-muted-foreground text-xs italic">{placeholder}</span>}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// ── Custom scatter tooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs font-body space-y-0.5 max-w-[180px]">
      <p className="font-semibold text-sm truncate">{d.name}</p>
      <p className="text-muted-foreground">{d.category}</p>
      <p>Sold: <strong>{d.popularity}×</strong></p>
      <p>Price: <strong>${d.price?.toFixed(2)}</strong></p>
      {d.cost != null && <p>Margin: <strong>{d.marginPct?.toFixed(1)}%</strong></p>}
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${QUADRANTS[d.quadrant]?.bg}`}>{QUADRANTS[d.quadrant]?.label}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuPerformance() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState("All");
  const [highlight, setHighlight] = useState(null); // quadrant filter

  useEffect(() => {
    Promise.all([
      base44.entities.MenuItem.list("name", 300),
      base44.entities.Order.list("-created_date", 1000),
    ]).then(([m, o]) => { setMenuItems(m); setOrders(o); setLoading(false); });
  }, []);

  // Count how many times each dish appears across all orders
  const popularityMap = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!item.name) return;
        const key = item.name.trim().toLowerCase();
        map[key] = (map[key] || 0) + (item.quantity || 1);
      });
    });
    return map;
  }, [orders]);

  const enriched = useMemo(() => {
    return menuItems.map(m => {
      const popularity = popularityMap[m.name?.trim().toLowerCase()] || 0;
      const marginPct  = m.cost != null && m.price > 0 ? ((m.price - m.cost) / m.price) * 100 : null;
      return { ...m, popularity, marginPct };
    });
  }, [menuItems, popularityMap]);

  // Medians for quadrant split (items with cost data only for margin median)
  const medPop    = useMemo(() => median(enriched.map(e => e.popularity)), [enriched]);
  const medMargin = useMemo(() => {
    const withCost = enriched.filter(e => e.marginPct != null).map(e => e.marginPct);
    return withCost.length ? median(withCost) : 50;
  }, [enriched]);

  const data = useMemo(() => enriched.map(e => ({
    ...e,
    quadrant: e.marginPct != null ? getQuadrant(e.marginPct, e.popularity, medMargin, medPop) : null,
    // For items without cost, use price as proxy for margin axis
    marginAxis: e.marginPct ?? (e.price / 2),
  })), [enriched, medMargin, medPop]);

  const filtered = useMemo(() => data.filter(d => {
    const matchCat  = category === "All" || d.category === category;
    const matchQuad = !highlight || d.quadrant === highlight;
    return matchCat && matchQuad;
  }), [data, category, highlight]);

  // Quadrant counts
  const quadCounts = useMemo(() => {
    const c = { star: 0, horse: 0, puzzle: 0, dog: 0 };
    data.forEach(d => { if (d.quadrant) c[d.quadrant]++; });
    return c;
  }, [data]);

  const updateItem = useCallback(async (id, patch) => {
    await base44.entities.MenuItem.update(id, patch);
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    toast.success("Updated!");
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 lg:px-10 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Menu Performance</h1>
            <p className="font-body text-xs text-muted-foreground">Popularity × Margin analysis · click a dish to edit price</p>
          </div>
        </div>
        <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-8">

        {/* ── Quadrant legend cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(QUADRANTS).map(([key, q]) => (
            <button
              key={key}
              onClick={() => setHighlight(h => h === key ? null : key)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${highlight === key ? "ring-2 ring-primary scale-[1.02]" : "hover:scale-[1.01]"} ${q.bg}`}
            >
              <p className="font-heading text-base font-bold">{q.label} <span className="font-body text-sm font-normal">({quadCounts[key]})</span></p>
              <p className="font-body text-xs mt-0.5 opacity-80">{q.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
          {highlight && (
            <button onClick={() => setHighlight(null)} className="ml-auto flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" /> Clear filter
            </button>
          )}
        </div>

        {/* ── Scatter Plot ── */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h2 className="font-heading text-base font-semibold">Popularity vs. Profit Margin</h2>
            <p className="font-body text-xs text-muted-foreground">
              Y-axis: margin % (or price proxy if no cost set) · X-axis: times ordered · dashed lines = median
            </p>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number" dataKey="popularity" name="Times Ordered"
                label={{ value: "Times Ordered", position: "insideBottom", offset: -10, fontSize: 11 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey="marginAxis" name="Margin / Price"
                label={{ value: "Margin %", angle: -90, position: "insideLeft", fontSize: 11 }}
                tick={{ fontSize: 11 }}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={medPop}    stroke="#94a3b8" strokeDasharray="6 3" label={{ value: "Median orders", fontSize: 10, fill: "#94a3b8" }} />
              <ReferenceLine y={medMargin} stroke="#94a3b8" strokeDasharray="6 3" label={{ value: "Median margin", fontSize: 10, fill: "#94a3b8" }} />
              <Scatter data={filtered} isAnimationActive={false}>
                {filtered.map((d, i) => (
                  <Cell key={i} fill={d.quadrant ? QUADRANTS[d.quadrant].color : "#94a3b8"} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── Data Table ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-heading text-base font-semibold">All Dishes — {filtered.length} shown</h2>
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Click any price or cost to edit inline
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {["Dish", "Category", "Quadrant", "Ordered", "Price", "Food Cost", "Margin"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 font-body text-sm text-muted-foreground">No items match selected filters.</td></tr>
                ) : filtered
                  .sort((a, b) => b.popularity - a.popularity)
                  .map(item => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-body text-sm font-medium">{item.name}</p>
                        {item.is_featured && <span className="text-xs text-primary">Chef's Pick</span>}
                      </td>
                      <td className="px-5 py-3 font-body text-sm text-muted-foreground">{item.category}</td>
                      <td className="px-5 py-3">
                        {item.quadrant
                          ? <span className={`px-2.5 py-1 rounded-full text-xs border font-body font-semibold ${QUADRANTS[item.quadrant].bg}`}>{QUADRANTS[item.quadrant].label}</span>
                          : <span className="font-body text-xs text-muted-foreground italic">Set cost to classify</span>}
                      </td>
                      <td className="px-5 py-3 font-heading text-sm font-bold">{item.popularity}</td>
                      <td className="px-5 py-3">
                        <EditableCell
                          value={item.price}
                          onSave={v => updateItem(item.id, { price: v })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <EditableCell
                          value={item.cost}
                          placeholder="Add cost"
                          onSave={v => updateItem(item.id, { cost: v })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        {item.marginPct != null
                          ? <span className={`font-body text-sm font-semibold ${item.marginPct >= medMargin ? "text-green-700" : "text-red-600"}`}>{item.marginPct.toFixed(1)}%</span>
                          : <span className="font-body text-xs text-muted-foreground italic">—</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Strategy Tips ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "star",   icon: Star,         tip: "Promote Stars heavily — feature them on the menu and in marketing." },
            { key: "horse",  icon: Zap,          tip: "Workhorses drive volume. Consider a small price increase to boost margin." },
            { key: "puzzle", icon: HelpCircle,   tip: "Puzzles have great margins but need promotion. Add photos or make them specials." },
            { key: "dog",    icon: TrendingDown,  tip: "Dogs underperform on both axes. Consider removing or repositioning." },
          ].map(({ key, icon: Icon, tip }) => (
            <div key={key} className={`flex items-start gap-3 p-4 rounded-2xl border ${QUADRANTS[key].bg}`}>
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-xs font-semibold mb-0.5">{QUADRANTS[key].label}</p>
                <p className="font-body text-xs opacity-90">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}