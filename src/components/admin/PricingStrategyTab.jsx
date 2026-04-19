import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PricingStrategyTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodCostTarget, setFoodCostTarget] = useState(30);
  const [editingId, setEditingId] = useState(null);
  const [editCost, setEditCost] = useState("");

  useEffect(() => {
    base44.entities.MenuItem.list("-created_date", 100).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const calculateRecommendedPrice = (cost, percentage) => {
    if (!cost || cost <= 0) return null;
    return (cost / (percentage / 100)).toFixed(2);
  };

  const handleCostSave = async (itemId, cost) => {
    if (!cost || isNaN(cost)) {
      toast.error("Please enter a valid cost");
      return;
    }
    await base44.entities.MenuItem.update(itemId, { cost: parseFloat(cost) });
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, cost: parseFloat(cost) } : i));
    setEditingId(null);
    setEditCost("");
    toast.success("Cost updated");
  };

  const missingCosts = items.filter(i => !i.cost).length;
  const recommendedPrice = (cost) => calculateRecommendedPrice(cost, foodCostTarget);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Menu Pricing Strategy</h3>
        <div className="flex items-center gap-4">
          <label className="font-body text-sm text-muted-foreground">Target Food Cost %:</label>
          <select
            value={foodCostTarget}
            onChange={(e) => setFoodCostTarget(parseInt(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
          >
            <option value={25}>25% (High Margin)</option>
            <option value={28}>28% (Standard)</option>
            <option value={30}>30% (Moderate)</option>
            <option value={33}>33% (Value)</option>
          </select>
        </div>
      </div>

      {missingCosts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-body text-sm font-semibold text-yellow-900">{missingCosts} items missing food costs</p>
            <p className="font-body text-xs text-yellow-700 mt-1">Add food costs below to calculate recommended pricing</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Items with Costs", value: items.filter(i => i.cost).length },
          { label: "Missing Costs", value: missingCosts },
          { label: "Target Food Cost", value: `${foodCostTarget}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="font-body text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item Name</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Food Cost</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Price</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommended Price</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variance</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const rec = recommendedPrice(item.cost);
              const variance = item.price && rec ? ((item.price - rec) / rec * 100).toFixed(0) : null;
              const isUnderpriced = variance && variance < -5;
              const isOverpriced = variance && variance > 5;

              return (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-body text-sm font-medium">{item.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-body text-xs text-muted-foreground">{item.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          className="w-20 border border-border rounded px-2 py-1 text-xs bg-background"
                          autoFocus
                        />
                        <button
                          onClick={() => handleCostSave(item.id, editCost)}
                          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditCost(item.cost || "");
                        }}
                        className="font-heading text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {item.cost ? `$${Number(item.cost).toFixed(2)}` : <span className="text-yellow-600">Add Cost</span>}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-heading text-sm font-semibold">
                      {item.price ? `$${Number(item.price).toFixed(2)}` : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {rec ? (
                      <span className="font-heading text-sm font-semibold text-primary">
                        ${rec}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {variance ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isUnderpriced ? "bg-yellow-100 text-yellow-800" : 
                        isOverpriced ? "bg-green-100 text-green-800" : 
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {variance > 0 ? "+" : ""}{variance}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="font-body text-sm text-blue-900">
          <strong>How it works:</strong> Add food costs for each dish. The recommended price is calculated as: Food Cost ÷ ({foodCostTarget}% ÷ 100). 
          Variance shows how your current price compares — negative means underpriced, positive means overpriced.
        </p>
      </div>
    </div>
  );
}