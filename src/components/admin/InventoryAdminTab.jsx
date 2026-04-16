import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, AlertTriangle, TrendingDown, X } from "lucide-react";
import { toast } from "sonner";

// ── Low Stock Alert ────────────────────────────────────────────────────────
function LowStockAlert({ items }) {
  const lowStock = items.filter(i => i.current_stock <= i.min_stock_level);

  if (lowStock.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-body font-semibold text-yellow-900">{lowStock.length} item(s) below minimum stock</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStock.map(i => (
              <span key={i.id} className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                {i.name} ({i.current_stock}/{i.min_stock_level} {i.unit})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inventory Item Form ────────────────────────────────────────────────────
function InventoryForm({ item, menuItems, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    name: "",
    category: "Produce",
    unit: "kg",
    current_stock: 0,
    min_stock_level: 0,
    reorder_quantity: 0,
    cost_per_unit: 0,
    supplier: "",
    linked_menu_items: [],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleMenuItem = (id) => {
    const linked = form.linked_menu_items || [];
    setForm(f => ({
      ...f,
      linked_menu_items: linked.includes(id) ? linked.filter(mid => mid !== id) : [...linked, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      current_stock: parseFloat(form.current_stock) || 0,
      min_stock_level: parseFloat(form.min_stock_level) || 0,
      reorder_quantity: parseFloat(form.reorder_quantity) || 0,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
    };

    if (item?.id) {
      await base44.entities.InventoryItem.update(item.id, data);
    } else {
      await base44.entities.InventoryItem.create(data);
    }
    onSave();
  };

  const CATEGORIES = ["Produce", "Meat", "Seafood", "Dairy", "Dry Goods", "Beverages", "Packaging", "Other"];

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
      <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "Add"} Inventory Item</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Item Name *</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Category</label>
          <select
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.category}
            onChange={e => set("category", e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Unit (kg, liter, etc.)</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.unit}
            onChange={e => set("unit", e.target.value)}
            placeholder="kg"
          />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Current Stock</label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.current_stock}
            onChange={e => set("current_stock", e.target.value)}
          />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Min Stock Level *</label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.min_stock_level}
            onChange={e => set("min_stock_level", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Reorder Quantity</label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.reorder_quantity}
            onChange={e => set("reorder_quantity", e.target.value)}
          />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Cost Per Unit ($)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.cost_per_unit}
            onChange={e => set("cost_per_unit", e.target.value)}
          />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Supplier</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.supplier}
            onChange={e => set("supplier", e.target.value)}
          />
        </div>
      </div>

      {/* Link Menu Items */}
      {menuItems.length > 0 && (
        <div>
          <label className="font-body text-sm text-muted-foreground mb-2 block">Link to Menu Items</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
            {menuItems.map(m => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.linked_menu_items || []).includes(m.id)}
                  onChange={() => toggleMenuItem(m.id)}
                  className="rounded w-4 h-4"
                />
                <span className="font-body text-xs">{m.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-border rounded-full font-body text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Usage Estimator ───────────────────────────────────────────────────────
function UsageEstimator({ inventoryItems, menuItems, reservations }) {
  // Simple usage calculation: based on upcoming reservations
  const upcomingReservations = reservations.filter(r => {
    const rDate = new Date(r.date + "T" + r.time);
    const daysAhead = (rDate - new Date()) / (1000 * 60 * 60 * 24);
    return daysAhead >= 0 && daysAhead <= 7; // Next 7 days
  });

  const estimatedUsage = {};
  upcomingReservations.forEach(res => {
    const linkedItems = menuItems.filter(m => m.id && Array.isArray(m.id) === false);
    linkedItems.forEach(item => {
      if (item.id) {
        const inventory = inventoryItems.find(inv =>
          inv.linked_menu_items && inv.linked_menu_items.includes(item.id)
        );
        if (inventory) {
          estimatedUsage[inventory.id] = (estimatedUsage[inventory.id] || 0) + (res.party_size || 1);
        }
      }
    });
  });

  const itemsAtRisk = inventoryItems.filter(item => {
    const usage = estimatedUsage[item.id] || 0;
    return item.current_stock - usage < item.min_stock_level;
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg font-semibold">7-Day Usage Forecast</h3>
      </div>

      {upcomingReservations.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">No upcoming reservations for the next 7 days.</p>
      ) : (
        <div className="space-y-2">
          <p className="font-body text-xs text-muted-foreground mb-3">
            {upcomingReservations.length} reservations ({upcomingReservations.reduce((sum, r) => sum + (r.party_size || 1), 0)} guests)
          </p>

          {itemsAtRisk.length > 0 ? (
            <div className="space-y-2">
              <p className="font-body text-xs font-semibold text-yellow-700 mb-2">⚠ Items at risk of stockout:</p>
              {itemsAtRisk.map(item => {
                const usage = estimatedUsage[item.id] || 0;
                const remaining = item.current_stock - usage;
                return (
                  <div key={item.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-body text-xs font-semibold">{item.name}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      Current: {item.current_stock} {item.unit} → Est. usage: {usage} {item.unit} → Remaining: {remaining} {item.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="font-body text-sm text-green-700">✓ All items should meet demand for the next 7 days.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────
export default function InventoryAdminTab() {
  const [inventory, setInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.InventoryItem.list("-created_date", 200),
      base44.entities.MenuItem.list("-created_date", 100),
      base44.entities.Reservation.list("-date", 100),
    ]).then(([inv, menu, res]) => {
      setInventory(inv);
      setMenuItems(menu);
      setReservations(res);
      setLoading(false);
    });
  }, []);

  const refreshInventory = async () => {
    const inv = await base44.entities.InventoryItem.list("-created_date", 200);
    setInventory(inv);
    setShowForm(false);
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    await base44.entities.InventoryItem.delete(id);
    setInventory(prev => prev.filter(i => i.id !== id));
    toast.success("Item removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      <LowStockAlert items={inventory} />

      {/* Usage Forecast */}
      <UsageEstimator inventoryItems={inventory} menuItems={menuItems} reservations={reservations} />

      {/* Add/Edit Form */}
      {showForm && (
        <InventoryForm
          item={editingItem}
          menuItems={menuItems}
          onSave={refreshInventory}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      {/* Inventory Table */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium mb-4"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Category</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
              <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Cost</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const isLow = item.current_stock <= item.min_stock_level;
              const linkedCount = (item.linked_menu_items || []).length;

              return (
                <tr key={item.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${isLow ? "bg-yellow-50/50" : ""}`}>
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-body text-sm font-medium">{item.name}</p>
                      {linkedCount > 0 && (
                        <p className="font-body text-xs text-muted-foreground">Linked: {linkedCount} menu item(s)</p>
                      )}
                      {isLow && <p className="font-body text-xs text-yellow-700">⚠ Low stock</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="font-body text-sm text-muted-foreground">{item.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-heading text-sm font-semibold">
                        {item.current_stock} {item.unit}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Min: {item.min_stock_level}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="font-body text-sm">${(item.cost_per_unit * item.current_stock).toFixed(2)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditingItem(item); setShowForm(true); }}
                        className="p-1.5 hover:text-primary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {inventory.length === 0 && (
          <div className="text-center py-10">
            <p className="font-body text-sm text-muted-foreground">No inventory items yet. Add your first item to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}