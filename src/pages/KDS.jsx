import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, AlertTriangle, Clock, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

// Only show New + Preparing on KDS (Ready goes to expeditor/server)
const KDS_STATUSES = ["New", "Preparing", "Ready"];

const STATUS_CONFIG = {
  New:       { border: "border-blue-500",   bg: "bg-blue-950",   badge: "bg-blue-500",   text: "text-blue-300",   btnBg: "bg-blue-500 hover:bg-blue-400",   btnLabel: "START PREPARING", next: "Preparing" },
  Preparing: { border: "border-amber-500",  bg: "bg-amber-950",  badge: "bg-amber-500",  text: "text-amber-300",  btnBg: "bg-amber-500 hover:bg-amber-400",  btnLabel: "MARK READY",      next: "Ready" },
  Ready:     { border: "border-green-500",  bg: "bg-green-950",  badge: "bg-green-500",  text: "text-green-300",  btnBg: "bg-green-500 hover:bg-green-400",  btnLabel: "MARK SERVED",     next: "Served" },
};

function useElapsed(createdDate) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const calc = () => setMins(Math.floor((Date.now() - new Date(createdDate)) / 60000));
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [createdDate]);
  return mins;
}

function ElapsedBadge({ createdDate }) {
  const mins = useElapsed(createdDate);
  const urgent = mins >= 15;
  const warning = mins >= 8;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
      urgent ? "bg-red-500 text-white animate-pulse" :
      warning ? "bg-yellow-500 text-black" :
      "bg-white/10 text-white/60"
    }`}>
      <Clock className="w-3 h-3" />
      {mins < 1 ? "just now" : `${mins}m`}
    </span>
  );
}

function KDSCard({ order, onAdvance, onRecall }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.New;
  const isRush = order.priority === "Rush";
  const mins = useElapsed(order.created_date);
  const isUrgent = mins >= 15;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden ${isRush || isUrgent ? "ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900" : ""}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-heading font-bold text-xl">T{order.table_number}</span>
          {order.server_name && (
            <span className="text-white/50 font-body text-xs">{order.server_name}</span>
          )}
          {isRush && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" /> RUSH
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ElapsedBadge createdDate={order.created_date} />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {(order.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`font-heading font-bold text-2xl leading-none shrink-0 ${cfg.text}`}>
              ×{item.quantity}
            </span>
            <div className="min-w-0">
              <p className="text-white font-body font-semibold text-base leading-tight">{item.name}</p>
              {item.notes && (
                <p className="text-white/50 font-body text-xs italic mt-0.5">{item.notes}</p>
              )}
            </div>
          </div>
        ))}
        {order.notes && (
          <p className="text-yellow-300 font-body text-xs italic border-t border-white/10 pt-2 mt-2">
            📝 {order.notes}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="px-4 pb-4 pt-1 space-y-2">
        <button
          onClick={() => onAdvance(order.id, cfg.next)}
          className={`w-full py-3 rounded-xl font-body font-bold text-sm text-white transition-colors ${cfg.btnBg}`}
        >
          {cfg.btnLabel}
        </button>
        {order.status !== "New" && (
          <button
            onClick={() => onRecall(order)}
            className="w-full py-1.5 rounded-xl font-body text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            ← Recall
          </button>
        )}
      </div>
    </motion.div>
  );
}

function LaneColumn({ status, orders, onAdvance, onRecall }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Lane Header */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-3 ${cfg.badge}`}>
        <span className="text-white font-body font-bold text-sm uppercase tracking-widest">{status}</span>
        <span className="ml-auto bg-white/20 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
          {orders.length}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 160px)" }}>
        <AnimatePresence>
          {orders.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className={`font-body text-sm ${cfg.text} opacity-40`}>No orders</p>
            </div>
          ) : (
            orders.map(order => (
              <KDSCard
                key={order.id}
                order={order}
                onAdvance={onAdvance}
                onRecall={onRecall}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function KDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [newAlert, setNewAlert] = useState(false);
  const alertTimer = useRef(null);

  const load = async () => {
    const data = await base44.entities.Order.list("-created_date", 300);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const unsub = base44.entities.Order.subscribe((event) => {
      setConnected(true);
      if (event.type === "create") {
        setOrders(prev => [event.data, ...prev]);
        // Flash new order alert
        setNewAlert(true);
        clearTimeout(alertTimer.current);
        alertTimer.current = setTimeout(() => setNewAlert(false), 3000);
        toast("🔔 New order — Table " + event.data.table_number, { duration: 4000 });
      } else if (event.type === "update") {
        setOrders(prev => prev.map(o => o.id === event.id ? event.data : o));
      } else if (event.type === "delete") {
        setOrders(prev => prev.filter(o => o.id !== event.id));
      }
    });

    // Connectivity heartbeat
    const heartbeat = setInterval(() => {
      setConnected(true); // If sub is running, we're connected
    }, 10000);

    return () => {
      unsub();
      clearInterval(heartbeat);
      clearTimeout(alertTimer.current);
    };
  }, []);

  const handleAdvance = async (id, nextStatus) => {
    await base44.entities.Order.update(id, { status: nextStatus });
    if (nextStatus === "Ready") toast.success("✅ Order ready — notify server!");
    if (nextStatus === "Served") toast.success("🍽️ Order served!");
  };

  const handleRecall = async (order) => {
    const prev = { New: null, Preparing: "New", Ready: "Preparing" };
    const previousStatus = prev[order.status];
    if (!previousStatus) return;
    await base44.entities.Order.update(order.id, { status: previousStatus });
    toast("↩️ Order recalled to " + previousStatus);
  };

  // Only show active orders (exclude Served) in KDS lanes
  const activeOrders = orders.filter(o => o.status !== "Served");
  const grouped = KDS_STATUSES.reduce((acc, s) => {
    acc[s] = activeOrders.filter(o => o.status === s);
    return acc;
  }, {});

  const totalActive = activeOrders.length;
  const rushCount = activeOrders.filter(o => o.priority === "Rush").length;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col select-none">
      {/* KDS Header */}
      <div className={`flex items-center justify-between px-6 py-3 border-b border-white/10 transition-colors ${newAlert ? "bg-blue-900" : "bg-gray-950"}`}>
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-heading text-lg font-bold text-white">Kitchen Display System</h1>
            <p className="font-body text-xs text-white/40">
              {totalActive} active · {rushCount > 0 ? <span className="text-red-400 font-semibold">{rushCount} RUSH</span> : "no rush orders"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 font-body text-xs ${connected ? "text-green-400" : "text-red-400"}`}>
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connected ? "Live" : "Disconnected"}
          </div>
          <a href="/kitchen" className="font-body text-xs text-white/40 hover:text-white/80 transition-colors">
            Full Dashboard →
          </a>
          <a href="/admin" className="font-body text-xs text-white/40 hover:text-white/80 transition-colors">
            Admin →
          </a>
        </div>
      </div>

      {/* KDS Grid */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full">
            {KDS_STATUSES.map(status => (
              <LaneColumn
                key={status}
                status={status}
                orders={grouped[status] || []}
                onAdvance={handleAdvance}
                onRecall={handleRecall}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}