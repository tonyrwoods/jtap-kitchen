import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wine, GlassWater, Martini } from "lucide-react";
import SelectDropdown from "../SelectDropdown";

const SECTIONS = ["Signature Cocktails", "Wine List", "Spirits & Liquors"];
const SPIRIT_TYPES = ["Bourbon & Whiskey", "Scotch", "Cognac", "Tequila", "Vodka", "Gin"];

const fmt = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? "" : Number(v).toFixed(2));

function LiquorItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(
    item || {
      name: "",
      section: "Signature Cocktails",
      spirit_type: "",
      description: "",
      price: "",
      price_half_pour: "",
      price_full_pour: "",
      price_bottle: "",
      flavors: "",
      sort_order: 0,
      is_active: true,
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
    const data = {
      ...form,
      price: num(form.price),
      price_half_pour: num(form.price_half_pour),
      price_full_pour: num(form.price_full_pour),
      price_bottle: num(form.price_bottle),
      sort_order: Number(form.sort_order) || 0,
      spirit_type: form.section === "Spirits & Liquors" ? form.spirit_type : null,
    };
    try {
      if (item?.id) {
        await base44.entities.LiquorMenuItem.update(item.id, data);
        toast.success("Liquor item updated");
      } else {
        await base44.entities.LiquorMenuItem.create(data);
        toast.success("Liquor item added");
      }
      onSave();
    } catch (err) {
      toast.error("Failed to save liquor item");
    }
  };

  const isWine = form.section === "Wine List";
  const isCocktail = form.section === "Signature Cocktails";
  const isSpirit = form.section === "Spirits & Liquors";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "Add"} Liquor Item</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Name *</label>
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Section *</label>
          <SelectDropdown
            value={form.section}
            onChange={(v) => set("section", v)}
            options={SECTIONS.map((s) => ({ value: s, label: s }))}
          />
        </div>
        {isSpirit && (
          <div>
            <label className="font-body text-sm text-muted-foreground mb-1 block">Spirit Type</label>
            <SelectDropdown
              value={form.spirit_type || ""}
              onChange={(v) => set("spirit_type", v)}
              options={[{ value: "", label: "—" }, ...SPIRIT_TYPES.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        )}
        {isCocktail && (
          <div>
            <label className="font-body text-sm text-muted-foreground mb-1 block">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              value={form.price ?? ""}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
        )}
        {isWine && (
          <>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">1/2 Pour Price (5 oz)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.price_half_pour ?? ""}
                onChange={(e) => set("price_half_pour", e.target.value)}
              />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Full Pour Price (8 oz)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.price_full_pour ?? ""}
                onChange={(e) => set("price_full_pour", e.target.value)}
              />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Bottle Price</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.price_bottle ?? ""}
                onChange={(e) => set("price_bottle", e.target.value)}
              />
            </div>
          </>
        )}
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Available Flavors</label>
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.flavors || ""}
            onChange={(e) => set("flavors", e.target.value)}
          />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Display Order</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.sort_order ?? 0}
            onChange={(e) => set("sort_order", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Description</label>
          <textarea
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            rows={2}
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="liq-active"
            checked={form.is_active !== false}
            onChange={(e) => set("is_active", e.target.checked)}
            className="rounded"
          />
          <label htmlFor="liq-active" className="font-body text-sm">
            Active (shown on menu)
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
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

const SECTION_ICON = {
  "Signature Cocktails": Martini,
  "Wine List": Wine,
  "Spirits & Liquors": GlassWater,
};

function priceSummary(item) {
  if (item.section === "Signature Cocktails") return item.price != null ? `$${fmt(item.price)}` : "—";
  if (item.section === "Wine List") {
    const parts = [item.price_half_pour, item.price_full_pour, item.price_bottle]
      .map((p) => (p != null ? `$${fmt(p)}` : "—"));
    return `${parts[0]} / ${parts[1]} / ${parts[2]}`;
  }
  return item.spirit_type || "—";
}

export default function LiquorMenuItemsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterSection, setFilterSection] = useState("All");

  const load = async () => {
    const data = await base44.entities.LiquorMenuItem.list("sort_order", 300);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteItem = async (id) => {
    if (!confirm("Delete this liquor item?")) return;
    await base44.entities.LiquorMenuItem.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Liquor item deleted");
  };

  const toggleActive = async (item) => {
    const is_active = item.is_active === false;
    await base44.entities.LiquorMenuItem.update(item.id, { is_active });
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active } : i)));
  };

  const grouped = SECTIONS.reduce((acc, s) => {
    acc[s] = items.filter((i) => i.section === s);
    return acc;
  }, {});

  const filtered = filterSection === "All" ? items : items.filter((i) => i.section === filterSection);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-muted-foreground mr-1">Section:</span>
          <SelectDropdown
            value={filterSection}
            onChange={(v) => setFilterSection(v)}
            options={[{ value: "All", label: "All" }, ...SECTIONS.map((s) => ({ value: s, label: s }))]}
          />
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Liquor Item
          </button>
        )}
      </div>

      {showForm && (
        <LiquorItemForm
          item={editingItem}
          onSave={async () => {
            await load();
            setShowForm(false);
            setEditingItem(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {SECTIONS.filter((s) => filterSection === "All" || filterSection === s).map((section) => {
        const sectionItems = grouped[section];
        if (sectionItems.length === 0) return null;
        const Icon = SECTION_ICON[section];
        return (
          <div key={section} className="space-y-3">
            <div className="flex items-center gap-2 pt-2">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="font-heading text-lg font-semibold">{section}</h3>
              <span className="font-body text-xs text-muted-foreground">({sectionItems.length})</span>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    {section === "Spirits & Liquors" && (
                      <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Type</th>
                    )}
                    <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                    <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Order</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sectionItems.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-body text-sm font-medium">{item.name}</p>
                        {item.flavors && (
                          <p className="font-body text-xs text-muted-foreground">Flavors: {item.flavors}</p>
                        )}
                        {item.is_active === false && (
                          <span className="text-xs text-muted-foreground italic">Inactive</span>
                        )}
                      </td>
                      {section === "Spirits & Liquors" && (
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="font-body text-sm text-muted-foreground">{item.spirit_type || "—"}</span>
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <span className="font-heading text-sm font-semibold">{priceSummary(item)}</span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="font-body text-sm text-muted-foreground">{item.sort_order ?? 0}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => toggleActive(item)}
                            className="px-2 py-1 rounded-lg text-xs font-body font-medium border border-border hover:bg-muted transition-colors"
                          >
                            {item.is_active === false ? "Activate" : "Deactivate"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            className="p-1.5 hover:text-primary transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 hover:text-destructive transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Wine className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No liquor items yet.</p>
        </div>
      )}
    </motion.div>
  );
}