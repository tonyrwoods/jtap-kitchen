import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import SelectDropdown from "@/components/SelectDropdown";

const CATEGORIES = ["Audio/Visual", "Decor", "Photography", "Other"];
const PRICE_UNITS = ["Flat Fee", "Per Hour"];

const EMPTY = { name: "", description: "", price: "", price_unit: "Flat Fee", category: "Audio/Visual", image_url: "", is_active: true, inventory_limit: "" };

function AddOnForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item ? { ...item, price: item.price ?? "", inventory_limit: item.inventory_limit ?? "" } : EMPTY);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: parseFloat(form.price) || 0,
      inventory_limit: form.inventory_limit === "" ? null : parseInt(form.inventory_limit),
    };
    if (item?.id) {
      await base44.entities.EventAddOn.update(item.id, data);
      toast.success("Add-on updated");
    } else {
      await base44.entities.EventAddOn.create(data);
      toast.success("Add-on added");
    }
    onSave();
  };

  const input = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "Add"} Add-On</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Name *</label>
          <input className={input} value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Category *</label>
          <SelectDropdown value={form.category} onChange={v => set("category", v)} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Price (USD) *</label>
          <input type="number" step="0.01" min="0" className={input} value={form.price} onChange={e => set("price", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Price Unit *</label>
          <SelectDropdown value={form.price_unit} onChange={v => set("price_unit", v)} options={PRICE_UNITS.map(u => ({ value: u, label: u }))} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Inventory Limit (per date; blank = unlimited)</label>
          <input type="number" min="0" className={input} value={form.inventory_limit} onChange={e => set("inventory_limit", e.target.value)} placeholder="Unlimited" />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-2 block">Image</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-sm text-muted-foreground">{uploading ? "Uploading..." : "Choose image"}</span>
              <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="hidden" />
            </label>
            {form.image_url && <img src={form.image_url} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-border" />}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Description</label>
          <textarea rows={2} className={`${input} resize-none`} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <label className="flex items-center gap-2 sm:col-span-2 font-body text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={e => set("is_active", e.target.checked)} className="rounded" />
          Active (available for booking)
        </label>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function EventAddOnsTab() {
  const [addons, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.EventAddOn.list("name", 200);
    setAddOns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this add-on?")) return;
    await base44.entities.EventAddOn.delete(id);
    setAddOns(prev => prev.filter(a => a.id !== id));
    toast.success("Add-on deleted");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {!showForm && (
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Add-On
        </button>
      )}
      {showForm && (
        <AddOnForm item={editing} onSave={() => { setShowForm(false); setEditing(null); load(); }} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      {addons.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-body text-muted-foreground">No event add-ons yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              {a.image_url && <div className="h-32 overflow-hidden"><img src={a.image_url} alt={a.name} className="w-full h-full object-cover" /></div>}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-body font-semibold text-foreground">{a.name}</p>
                    <span className="text-xs text-muted-foreground">{a.category}</span>
                  </div>
                  {!a.is_active && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Inactive</span>}
                </div>
                <p className="font-heading text-lg font-bold text-primary mt-1">${Number(a.price).toFixed(2)}<span className="font-body text-xs text-muted-foreground font-normal"> / {a.price_unit}</span></p>
                {a.inventory_limit != null && <p className="font-body text-xs text-muted-foreground mt-0.5">Limit: {a.inventory_limit} per date</p>}
                {a.description && <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">{a.description}</p>}
                <div className="flex items-center gap-2 justify-end mt-3 pt-3 border-t border-border">
                  <button onClick={() => { setEditing(a); setShowForm(true); }} className="p-1.5 hover:text-primary transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(a.id)} className="p-1.5 hover:text-destructive transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}