import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, ChefHat, CheckCircle, Utensils, AlertTriangle, X, ArrowLeftRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import SwapRequestsPanel from "../components/SwapRequestsPanel";

const STATUSES = ["New", "Preparing", "Ready", "Served"];

const STATUS_CONFIG = {
  New:       { color: "border-blue-400 bg-blue-50",   badge: "bg-blue-100 text-blue-800",   icon: Clock,        next: "Preparing" },
  Preparing: { color: "border-amber-400 bg-amber-50", badge: "bg-amber-100 text-amber-800", icon: ChefHat,      next: "Ready" },
  Ready:     { color: "border-green-400 bg-green-50", badge: "bg-green-100 text-green-800", icon: CheckCircle,  next: "Served" },
  Served:    { color: "border-muted bg-muted/30",     badge: "bg-muted text-muted-foreground", icon: Utensils,  next: null },
};

const NEXT_LABEL = { New: "Start Preparing", Preparing: "Mark Ready", Ready: "Mark Served" };

function elapsed(createdDate) {
  const mins = Math.floor((Date.now() - new Date(createdDate)) / 60000);
  if (mins < 1) return "just now";
  return `${mins}m ago`;
}

function NewOrderModal({ onClose, onSave }) {
  const [form, setForm] = useState({ table_number: "", server_name: "", notes: "", priority: "Normal", items: [{ name: "", quantity: 1, notes: "" }] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (i, k, v) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [k]: v };
    return { ...f, items };
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: "", quantity: 1, notes: "" }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.table_number) { toast.error("Table number is required"); return; }
    const validItems = form.items.filter(i => i.name.trim());
    await base44.entities.Order.create({ ...form, table_number: Number(form.table_number), items: validItems, status: "New" });
    toast.success("Order sent to kitchen!");
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">New Order</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Table # *</label>
            <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.table_number} onChange={e => set("table_number", e.target.value)} />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Server</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.server_name} onChange={e => set("server_name", e.target.value)} />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Priority</label>
            <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.priority} onChange={e => set("priority", e.target.value)}>
              <option>Normal</option>
              <option>Rush</option>
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Notes</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Allergies, etc." />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-body text-xs text-muted-foreground font-semibold uppercase tracking-wide">Items</label>
            <button onClick={addItem} className="font-body text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add item</button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm bg-background" placeholder="Dish name" value={item.name} onChange={e => setItem(i, "name", e.target.value)} />
                <input type="number" min="1" className="w-14 border border-border rounded-lg px-2 py-1.5 text-sm bg-background" value={item.quantity} onChange={e => setItem(i, "quantity", Number(e.target.value))} />
                <input className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm bg-background" placeholder="Notes" value={item.notes} onChange={e => setItem(i, "notes", e.target.value)} />
                {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Send to Kitchen</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.New;
  const Icon = cfg.icon;
  const isRush = order.priority === "Rush";
  const [ticking, setTicking] = useState(elapsed(order.created_date));

  useEffect(() => {
    const id = setInterval(() => setTicking(elapsed(order.created_date)), 30000);
    return () => clearInterval(id);
  }, [order.created_date]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`border-l-4 rounded-xl p-4 space-y-3 ${cfg.color} ${isRush ? "ring-2 ring-red-400" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold">Table {order.table_number}</span>
            {isRush && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-body font-bold">
                <AlertTriangle className="w-3 h-3" /> RUSH
              </span>
            )}
          </div>
          {order.server_name && <p className="font-body text-xs text-muted-foreground">Server: {order.server_name}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-body font-semibold ${cfg.badge}`}>{order.status}</span>
          <span className="font-body text-xs text-muted-foreground">{ticking}</span>
        </div>
      </div>

      {order.items?.length > 0 && (
        <ul className="space-y-1">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 font-body text-sm">
              <span className="font-semibold shrink-0">×{item.quantity}</span>
              <span className="flex-1">{item.name}{item.notes ? <span className="text-muted-foreground italic"> – {item.notes}</span> : null}</span>
            </li>
          ))}
        </ul>
      )}

      {order.notes && (
        <p className="font-body text-xs text-muted-foreground italic border-t border-border/50 pt-2">📝 {order.notes}</p>
      )}

      {cfg.next && (
        <button
          onClick={() => onStatusChange(order.id, cfg.next)}
          className="w-full py-2 bg-foreground text-background rounded-full font-body text-sm font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5"
        >
          <Icon className="w-4 h-4" />
          {NEXT_LABEL[order.status]}
        </button>
      )}
    </motion.div>
  );
}

function Column({ status, orders, onStatusChange }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 ${cfg.badge}`}>
        <Icon className="w-4 h-4" />
        <span className="font-body text-sm font-semibold">{status}</span>
        <span className="ml-auto font-body text-xs font-bold bg-white/60 rounded-full px-2 py-0.5">{orders.length}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        <AnimatePresence>
          {orders.length === 0 ? (
            <p className="font-body text-xs text-muted-foreground text-center py-8 opacity-60">No orders</p>
          ) : (
            orders.map(o => <OrderCard key={o.id} order={o} onStatusChange={onStatusChange} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showServed, setShowServed] = useState(false);
  const [showSwaps, setShowSwaps] = useState(false);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);

  const load = async () => {
    const data = await base44.entities.Order.list("-created_date", 200);
    setOrders(data);
    setLoading(false);
  };

  // Pull-to-refresh handler
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = containerRef.current.scrollTop;

    if (scrollTop === 0 && currentY > startY.current && currentY - startY.current > 50) {
      setIsRefreshing(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
    toast.success("Refreshed!");
  };

  useEffect(() => {
    load();

    base44.entities.ShiftSwapRequest.filter({ status: "Pending" }, "-created_date", 100)
      .then(data => setPendingSwaps(data.length));

    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type === "create") setOrders(prev => [event.data, ...prev]);
      else if (event.type === "update") setOrders(prev => prev.map(o => o.id === event.id ? event.data : o));
      else if (event.type === "delete") setOrders(prev => prev.filter(o => o.id !== event.id));
    });

    const unsubSwaps = base44.entities.ShiftSwapRequest.subscribe((event) => {
      if (event.type === "create") setPendingSwaps(p => p + 1);
      else if (event.type === "update" && event.data?.status !== "Pending") setPendingSwaps(p => Math.max(0, p - 1));
    });

    return () => { unsub(); unsubSwaps(); };
  }, []);

  const handleStatusChange = async (id, status) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      await base44.entities.Order.update(id, { status });
      if (status === "Served") toast.success("Order marked as served!");
      else if (status === "Ready") toast.success("Order ready! Notify the server.");
    } catch (error) {
      // Revert on error
      const data = await base44.entities.Order.list("-created_date", 200);
      setOrders(data);
      toast.error("Failed to update order");
    }
  };

  const activeStatuses = showServed ? STATUSES : STATUSES.filter(s => s !== "Served");
  const grouped = activeStatuses.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s);
    return acc;
  }, {});

  const activeCount = orders.filter(o => o.status !== "Served").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Kitchen Dashboard</h1>
            <p className="font-body text-xs text-muted-foreground">Live · {activeCount} active order{activeCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <label className="flex items-center gap-2 font-body text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" className="rounded" checked={showServed} onChange={e => setShowServed(e.target.checked)} />
            Show Served
          </label>
          <button
            onClick={() => setShowSwaps(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap Requests
            {pendingSwaps > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {pendingSwaps}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>
          <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
        </div>
      </div>

      {/* Board */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 overflow-x-auto p-5"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-5 min-w-max h-full">
            {activeStatuses.map(status => (
              <Column key={status} status={status} orders={grouped[status] || []} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); }} />}
      {showSwaps && <SwapRequestsPanel onClose={() => setShowSwaps(false)} />}
    </div>
  );
}