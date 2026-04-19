import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, CheckCircle, Plus, RefreshCw, Bot, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import InventoryTable from "../components/inventory/InventoryTable";
import InventoryItemModal from "../components/inventory/InventoryItemModal";
import AIWasteAdvisor from "../components/inventory/AIWasteAdvisor";
import AIForecastingPanel from "../components/inventory/AIForecastingPanel";

const STATUS_CONFIG = {
  "Out of Stock": { color: "bg-red-100 text-red-800", icon: AlertTriangle, dot: "bg-red-500" },
  "Low Stock":    { color: "bg-orange-100 text-orange-800", icon: TrendingDown, dot: "bg-orange-500" },
  "Reorder Soon": { color: "bg-yellow-100 text-yellow-800", icon: RefreshCw, dot: "bg-yellow-500" },
  "OK":           { color: "bg-green-100 text-green-800", icon: CheckCircle, dot: "bg-green-500" },
};

export { STATUS_CONFIG };

export default function InventoryManagement() {
  const [forecast, setForecast] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState("forecast");
  const [menuItems, setMenuItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);

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
    await loadData();
    setIsRefreshing(false);
    toast.success("Refreshed!");
  };

  const loadData = async () => {
    setLoading(true);
    const [forecastRes, menuRes] = await Promise.all([
      base44.functions.invoke("demandForecast", {}),
      base44.entities.MenuItem.list("name", 200),
    ]);
    setForecast(forecastRes.data.forecast || []);
    setReorderAlerts(forecastRes.data.reorder_alerts || []);
    setSummary(forecastRes.data.summary || null);
    setMenuItems(menuRes);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSaved = async () => {
    setShowModal(false);
    setEditingItem(null);
    await loadData();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    // Optimistic delete
    const currentItems = [...menuItems];
    const originalForecast = [...forecast];
    const originalSummary = { ...summary };
    
    setForecast(prev => prev.filter(f => f.id !== id));
    if (summary) {
      setSummary({
        ...summary,
        ok: Math.max(0, summary.ok - 1)
      });
    }
    
    try {
      await base44.entities.InventoryItem.delete(id);
      toast.success("Item removed.");
    } catch (error) {
      // Revert on error
      setMenuItems(currentItems);
      setForecast(originalForecast);
      setSummary(originalSummary);
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Inventory & Waste Reduction</h1>
            <p className="font-body text-xs text-muted-foreground">AI-powered demand forecasting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAI(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-medium border transition-all ${
              showAI ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            }`}
          >
            <Bot className="w-4 h-4" /> AI Advisor
          </button>
          {reorderAlerts.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-body text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" /> {reorderAlerts.length} Reorder Alert{reorderAlerts.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
        </div>
      </div>

      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 p-6 space-y-6 overflow-y-auto"
      >
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Out of Stock", value: summary.out_of_stock, status: "Out of Stock" },
              { label: "Low Stock",    value: summary.low_stock,    status: "Low Stock" },
              { label: "Reorder Soon", value: summary.reorder_soon, status: "Reorder Soon" },
              { label: "OK",           value: summary.ok,           status: "OK" },
            ].map(({ label, value, status }) => {
              const cfg = STATUS_CONFIG[status];
              const Icon = cfg.icon;
              return (
                <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-muted-foreground">{label}</p>
                    <p className="font-heading text-2xl font-bold">{value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Advisor Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AIWasteAdvisor forecast={forecast} summary={summary} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          {[
            { key: "forecast", label: "AI Forecast", icon: Sparkles },
            { key: "inventory", label: "Inventory Table", icon: Package },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all ${
                activeTab === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* AI Forecasting Panel */}
        {activeTab === "forecast" && (
          <AIForecastingPanel
            forecast={forecast}
            reorderAlerts={reorderAlerts}
            summary={summary}
            loading={loading}
          />
        )}

        {/* Inventory Table */}
        {activeTab === "inventory" && (
          <InventoryTable
            forecast={forecast}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showModal && (
        <InventoryItemModal
          item={editingItem}
          menuItems={menuItems}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}