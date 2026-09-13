import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, CheckCircle2, Circle, CalendarDays, X } from "lucide-react";
import SelectDropdown from "@/components/SelectDropdown";

const CATEGORIES = ["Wedding Planner", "Event Planner", "DJ", "Musician", "Photographer", "Florist", "MC / Host", "Clown / Entertainer", "Officiant", "Other"];
const RATE_UNITS = ["Flat Rate", "Per Hour", "Per Guest"];

const EMPTY = { name: "", category: "DJ", bio: "", photo_url: "", base_rate: "", rate_unit: "Flat Rate", contact_email: "", is_active: false, is_featured: false };

function TalentForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item ? { ...item, base_rate: item.base_rate ?? "" } : EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const data = { ...form, base_rate: parseFloat(form.base_rate) || 0 };
    if (item?.id) {
      await base44.entities.EventServiceProvider.update(item.id, data);
      toast.success("Talent updated");
    } else {
      await base44.entities.EventServiceProvider.create(data);
      toast.success("Talent added");
    }
    onSave();
  };

  const input = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "Add"} Talent</h3>
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
          <label className="font-body text-sm text-muted-foreground mb-1 block">Base Rate (USD)</label>
          <input type="number" step="0.01" min="0" className={input} value={form.base_rate} onChange={e => set("base_rate", e.target.value)} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Rate Unit</label>
          <SelectDropdown value={form.rate_unit} onChange={v => set("rate_unit", v)} options={RATE_UNITS.map(u => ({ value: u, label: u }))} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Contact Email</label>
          <input type="email" className={input} value={form.contact_email || ""} onChange={e => set("contact_email", e.target.value)} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Photo URL</label>
          <input type="url" className={input} value={form.photo_url || ""} onChange={e => set("photo_url", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Bio</label>
          <textarea rows={3} className={`${input} resize-none`} value={form.bio || ""} onChange={e => set("bio", e.target.value)} />
        </div>
        <div className="flex items-center gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={!!form.is_active} onChange={e => set("is_active", e.target.checked)} className="rounded" />
            Active (visible in booking flow)
          </label>
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={!!form.is_featured} onChange={e => set("is_featured", e.target.checked)} className="rounded" />
            Featured
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

function AvailabilityManager({ provider }) {
  const [blocks, setBlocks] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.TalentAvailability.filter({ provider_id: provider.id }, "date", 200);
    setBlocks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [provider.id]);

  const addBlock = async (available) => {
    if (!date) { toast.error("Pick a date"); return; }
    await base44.entities.TalentAvailability.create({ provider_id: provider.id, date, is_available: available });
    setDate("");
    toast.success("Availability block added");
    load();
  };

  const toggleBlock = async (b) => {
    await base44.entities.TalentAvailability.update(b.id, { is_available: !b.is_available });
    load();
  };

  const removeBlock = async (id) => {
    await base44.entities.TalentAvailability.delete(id);
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h4 className="font-body text-sm font-semibold">Availability blocks — {provider.name}</h4>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background" />
        <button onClick={() => addBlock(true)} className="px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors">Mark Available</button>
        <button onClick={() => addBlock(false)} className="px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors">Mark Unavailable</button>
      </div>
      {loading ? (
        <p className="font-body text-xs text-muted-foreground">Loading…</p>
      ) : blocks.length === 0 ? (
        <p className="font-body text-xs text-muted-foreground">No date blocks set. Talent is assumed available unless marked otherwise.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {blocks.map(b => (
            <span key={b.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              <button onClick={() => toggleBlock(b)} className="hover:opacity-70">{b.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}</button>
              {b.date}
              <button onClick={() => removeBlock(b.id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventTalentTab() {
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [availabilityFor, setAvailabilityFor] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.EventServiceProvider.list("name", 200);
    setTalent(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (t) => {
    await base44.entities.EventServiceProvider.update(t.id, { is_active: !t.is_active });
    setTalent(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
    toast.success(t.is_active ? "Deactivated" : "Activated");
  };

  const toggleFeatured = async (t) => {
    await base44.entities.EventServiceProvider.update(t.id, { is_featured: !t.is_featured });
    setTalent(prev => prev.map(x => x.id === t.id ? { ...x, is_featured: !t.is_featured } : x));
  };

  const remove = async (id) => {
    if (!confirm("Delete this talent entry?")) return;
    await base44.entities.EventServiceProvider.delete(id);
    setTalent(prev => prev.filter(t => t.id !== id));
    toast.success("Talent deleted");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {!showForm && (
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Talent
        </button>
      )}
      {showForm && (
        <TalentForm item={editing} onSave={() => { setShowForm(false); setEditing(null); load(); }} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      {talent.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-body text-muted-foreground">No talent in the catalog yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {talent.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.name} className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body font-semibold text-foreground">{t.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{t.category}</span>
                      {t.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
                      {!t.is_active && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Inactive</span>}
                    </div>
                    <p className="font-body text-sm text-muted-foreground mt-0.5">
                      {t.base_rate ? `$${Number(t.base_rate).toFixed(0)} · ${t.rate_unit}` : "Rate not set"}
                      {t.contact_email && <span className="hidden sm:inline"> · {t.contact_email}</span>}
                    </p>
                    {t.bio && <p className="font-body text-sm text-muted-foreground mt-1 line-clamp-2">{t.bio}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(t)} className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-colors ${t.is_active ? "border-green-300 text-green-700 bg-green-50" : "border-amber-300 text-amber-700 bg-amber-50"}`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => setAvailabilityFor(availabilityFor === t.id ? null : t.id)} className="px-3 py-1.5 rounded-lg text-xs font-body font-medium border border-border hover:bg-muted transition-colors">
                    Availability
                  </button>
                  <button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 hover:text-primary transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(t.id)} className="p-1.5 hover:text-destructive transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {availabilityFor === t.id && <AvailabilityManager provider={t} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}