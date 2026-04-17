import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const SEASONS = ["Spring", "Summer", "Fall", "Winter", "Year-Round"];

function DishForm({ dish, onSave, onCancel }) {
  const [form, setForm] = useState(dish || {
    name: "", description: "", season: "Year-Round",
    image_url: "", chef_note: "", price: "", is_active: true, sort_order: 0
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: form.price ? parseFloat(form.price) : undefined, sort_order: parseInt(form.sort_order) || 0 };
    if (dish?.id) {
      await base44.entities.FeaturedDish.update(dish.id, data);
    } else {
      await base44.entities.FeaturedDish.create(data);
    }
    toast.success(dish?.id ? "Dish updated" : "Dish added");
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
      <h3 className="font-heading text-lg font-semibold">{dish?.id ? "Edit" : "Add"} Featured Dish</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Dish Name *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Season</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.season} onChange={e => set("season", e.target.value)}>
            {SEASONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Image URL *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.image_url} onChange={e => set("image_url", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" rows={3}
            value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Chef's Note</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" rows={2}
            value={form.chef_note} onChange={e => set("chef_note", e.target.value)} placeholder="A personal message from the chef..." />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Price (USD)</label>
          <input type="number" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.price} onChange={e => set("price", e.target.value)} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Display Order</label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.sort_order} onChange={e => set("sort_order", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="rounded" />
          <label htmlFor="is_active" className="font-body text-sm">Show on Homepage</label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function FeaturedDishesTab() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  const load = () => base44.entities.FeaturedDish.list("sort_order", 50).then(d => { setDishes(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const deleteDish = async (id) => {
    await base44.entities.FeaturedDish.delete(id);
    setDishes(prev => prev.filter(d => d.id !== id));
    toast.success("Dish removed");
  };

  const toggleActive = async (dish) => {
    await base44.entities.FeaturedDish.update(dish.id, { is_active: !dish.is_active });
    setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_active: !d.is_active } : d));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Chef Highlights — Featured Dishes</h3>
        {!showForm && (
          <button onClick={() => { setEditingDish(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Dish
          </button>
        )}
      </div>

      {showForm && (
        <DishForm dish={editingDish} onSave={() => { setShowForm(false); setEditingDish(null); load(); }}
          onCancel={() => { setShowForm(false); setEditingDish(null); }} />
      )}

      {dishes.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <p className="font-body text-muted-foreground">No featured dishes yet. Add one to display the Chef Highlights carousel on the homepage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map(dish => (
            <div key={dish.id} className={`bg-card border rounded-2xl overflow-hidden ${!dish.is_active ? "opacity-50" : "border-border"}`}>
              {dish.image_url && (
                <img src={dish.image_url} alt={dish.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-heading font-semibold text-foreground">{dish.name}</p>
                  {dish.season && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body whitespace-nowrap">{dish.season}</span>
                  )}
                </div>
                {dish.description && <p className="font-body text-xs text-muted-foreground line-clamp-2 mb-2">{dish.description}</p>}
                {dish.price && <p className="font-heading text-sm font-bold text-primary">${Number(dish.price).toFixed(2)}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => toggleActive(dish)} title={dish.is_active ? "Hide" : "Show"}
                    className="p-1.5 hover:text-primary transition-colors text-muted-foreground">
                    {dish.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditingDish(dish); setShowForm(true); }}
                    className="p-1.5 hover:text-primary transition-colors text-muted-foreground">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteDish(dish.id)}
                    className="p-1.5 hover:text-destructive transition-colors text-muted-foreground">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}