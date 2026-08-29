import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Sparkles, Wrench, Bug, Palette } from "lucide-react";

const CATEGORIES = ["Feature", "Improvement", "Fix", "Design"];

const CAT_META = {
  Feature: { icon: Sparkles, chip: "bg-purple-100 text-purple-700" },
  Improvement: { icon: Wrench, chip: "bg-blue-100 text-blue-700" },
  Fix: { icon: Bug, chip: "bg-red-100 text-red-700" },
  Design: { icon: Palette, chip: "bg-amber-100 text-amber-700" },
};

const EMPTY = {
  title: "",
  category: "Improvement",
  summary: "",
  details: "",
  entry_date: new Date().toISOString().split("T")[0],
  version: "",
  is_published: true,
};

export default function ChangelogAdminTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    const data = await base44.entities.ChangelogEntry.list("-entry_date", 200);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY, entry_date: new Date().toISOString().split("T")[0] }); setShowForm(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error("Title is required"); return; }
    try {
      if (editing?.id) {
        await base44.entities.ChangelogEntry.update(editing.id, form);
        toast.success("Entry updated");
      } else {
        await base44.entities.ChangelogEntry.create(form);
        toast.success("Entry added");
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch {
      toast.error("Failed to save entry");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this changelog entry?")) return;
    await base44.entities.ChangelogEntry.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">App Changelog</h3>
          <p className="font-body text-sm text-muted-foreground">Document ongoing improvements. Published entries show on the public "What's New" page.</p>
        </div>
        {!showForm && (
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
            <Plus className="w-4 h-4" /> Log Improvement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-base font-semibold">{editing?.id ? "Edit" : "New"} Entry</h4>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Title *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Added event calendar page" />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Category</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Entry Date</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.entry_date} onChange={(e) => set("entry_date", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Version Tag (optional)</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="v2.4" />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} className="w-4 h-4" />
                <span className="font-body text-sm">Published</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Short Summary</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One-line description" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Details</label>
              <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none" value={form.details} onChange={(e) => set("details", e.target.value)} placeholder="What changed, why it matters, any notes..." />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save Entry</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <p className="font-body text-sm text-muted-foreground">No changelog entries yet. Click "Log Improvement" to add your first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const meta = CAT_META[entry.category] || CAT_META.Improvement;
            const Icon = meta.icon;
            return (
              <div key={entry.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.chip}`}><Icon className="w-3 h-3" />{entry.category}</span>
                      <span className="font-body text-xs text-muted-foreground">{entry.entry_date}</span>
                      {entry.version && <span className="font-body text-xs text-muted-foreground">· {entry.version}</span>}
                      {!entry.is_published && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Draft</span>}
                    </div>
                    <h4 className="font-heading text-base font-semibold">{entry.title}</h4>
                    {entry.summary && <p className="font-body text-sm text-muted-foreground mt-0.5">{entry.summary}</p>}
                    {entry.details && <p className="font-body text-sm text-muted-foreground/80 mt-2 whitespace-pre-wrap">{entry.details}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(entry)} className="p-1.5 hover:text-primary transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(entry.id)} className="p-1.5 hover:text-destructive transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}