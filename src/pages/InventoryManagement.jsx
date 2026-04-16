import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, CheckCircle, Plus, RefreshCw, Bot } from "lucide-react";
import { toast } from "sonner";
import InventoryTable from "../components/inventory/InventoryTable";
import InventoryItemModal from "../components/inventory/InventoryItemModal";
import AIWasteAdvisor from "../components/inventory/AIWasteAdvisor";

const STATUS_CONFIG = {
  "Out of Stock": { color: "bg-red-100 text-red-800", icon: AlertTriangle, dot: "bg-red-500" },
  "Low Stock":    { color: "bg-orange-100 text-orange-800", icon: TrendingDown, dot: "bg-orange-500" },
  "Reorder Soon": { color: "bg-yellow-100 text-yellow-800", icon: RefreshCw, dot: "bg-yellow-500" },
  "OK":           { color: "bg-green-100 text-green-800", icon: CheckCircle, dot: "bg-green-500" },
};

export { STATUS_CONFIG };

export default function InventoryManagement() {
  const [forecast, setForecast] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  const loadData = async () => {
    setLoading(true);
    const [forecastRes, menuRes] = await Promise.all([
      base44.functions.invoke("demandForecast", {}),
      base44.entities.MenuItem.list("name", 200),
    ]);
    setForecast(forecastRes.data.forecast || []);
    setSummary(forecastRes.data.summary || null);
    setMenuItems(menuRes);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSaved = () => {
    setShowModal(false);
    setEditingItem(null);
    loadData();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.InventoryItem.delete(id);
    toast.success("Item removed.");
    loadData();
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
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-full font-body text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
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

      <div className="flex-1 p-6 space-y-6">
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

        {/* Inventory Table */}
        <InventoryTable
          forecast={forecast}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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