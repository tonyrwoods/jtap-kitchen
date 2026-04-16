import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Produce", "Meat", "Seafood", "Dairy", "Dry Goods", "Beverages", "Packaging", "Other"];

export default function InventoryItemModal({ item, menuItems, onClose, onSaved }) {
  const [form, setForm] = useState(item || {
    name: "", category: "Other", unit: "", current_stock: 0,
    min_stock_level: 0, reorder_quantity: 0, supplier: "",
    cost_per_unit: 0, last_restock_date: "", expiry_date: "",
    linked_menu_items: [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleLinked = (id) => {
    const linked = form.linked_menu_items || [];
    set("linked_menu_items", linked.includes(id) ? linked.filter(x => x !== id) : [...linked, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (item?.id) {
      await base44.entities.InventoryItem.update(item.id, form);
      toast.success("Item updated!");
    } else {
      await base44.entities.InventoryItem.create(form);
      toast.success("Item added!");
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "Add"} Inventory Item</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="font-body text-xs text-muted-foreground mb-1 block">Item Name *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Category</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Unit *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="kg, each, liter…" value={form.unit} onChange={e => set("unit", e.target.value)} required />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Current Stock</label>
              <input type="number" min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.current_stock} onChange={e => set("current_stock", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Min Stock Level</label>
              <input type="number" min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.min_stock_level} onChange={e => set("min_stock_level", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Reorder Quantity</label>
              <input type="number" min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.reorder_quantity} onChange={e => set("reorder_quantity", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Cost Per Unit ($)</label>
              <input type="number" min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.cost_per_unit} onChange={e => set("cost_per_unit", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Supplier</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.supplier} onChange={e => set("supplier", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Last Restock Date</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.last_restock_date} onChange={e => set("last_restock_date", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Expiry Date</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
            </div>
          </div>

          {/* Linked Menu Items */}
          {menuItems.length > 0 && (
            <div>
              <label className="font-body text-xs text-muted-foreground mb-2 block">Linked Menu Items (for demand tracking)</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto border border-border rounded-lg p-3">
                {menuItems.map(mi => (
                  <label key={mi.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={(form.linked_menu_items || []).includes(mi.id)}
                      onChange={() => toggleLinked(mi.id)}
                    />
                    <span className="font-body text-xs truncate">{mi.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
              {saving ? "Saving…" : item?.id ? "Update Item" : "Add Item"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}