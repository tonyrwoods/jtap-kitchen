import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Save, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const PAGES = [
  { key: "home", label: "Home" },
  { key: "menu", label: "Digital Menu" },
  { key: "events", label: "Events" },
  { key: "gift-cards", label: "Gift Cards" },
  { key: "loyalty", label: "Loyalty Program" },
  { key: "submit-review", label: "Submit Review" },
  { key: "loyalty-portal", label: "Loyalty Portal" },
];

const EMPTY = (page) => ({
  page_key: page.key,
  page_label: page.label,
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_title: "",
  og_description: "",
});

function PageSeoForm({ page, initial, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY(page));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    if (form.id) {
      await base44.entities.SeoSettings.update(form.id, form);
    } else {
      const created = await base44.entities.SeoSettings.create(form);
      setForm(created);
    }
    setSaving(false);
    toast.success(`SEO settings saved for "${page.label}"`);
    onSaved();
  };

  const titleLen = form.meta_title?.length || 0;
  const descLen = form.meta_description?.length || 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-body font-semibold text-sm">{page.label}</span>
          {form.meta_title && (
            <span className="font-body text-xs text-muted-foreground truncate max-w-xs hidden sm:block">
              — {form.meta_title}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-border pt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-body text-xs text-muted-foreground font-medium">Meta Title</label>
              <span className={`font-body text-xs ${titleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                {titleLen}/60
              </span>
            </div>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              placeholder="e.g. JTAP Kitchen — Fine Dining in Memphis"
              value={form.meta_title}
              onChange={e => set("meta_title", e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-body text-xs text-muted-foreground font-medium">Meta Description</label>
              <span className={`font-body text-xs ${descLen > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                {descLen}/160
              </span>
            </div>
            <textarea
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none"
              placeholder="A short description of this page for search engines…"
              value={form.meta_description}
              onChange={e => set("meta_description", e.target.value)}
            />
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground font-medium mb-1 block">
              Keywords <span className="font-normal">(comma-separated)</span>
            </label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              placeholder="fine dining, Memphis restaurant, farm-to-table"
              value={form.meta_keywords}
              onChange={e => set("meta_keywords", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="font-body text-xs text-muted-foreground font-medium mb-1 block">OG Title (Social)</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                placeholder="Defaults to Meta Title"
                value={form.og_title}
                onChange={e => set("og_title", e.target.value)}
              />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground font-medium mb-1 block">OG Description (Social)</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                placeholder="Defaults to Meta Description"
                value={form.og_description}
                onChange={e => set("og_description", e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SeoTab() {
  const [seoMap, setSeoMap] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const all = await base44.entities.SeoSettings.list("-created_date", 50);
    const map = {};
    all.forEach(s => { map[s.page_key] = s; });
    setSeoMap(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <Search className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-body text-sm font-semibold text-foreground">SEO Settings</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            Configure meta titles, descriptions, and keywords for each page. These are applied dynamically when the page loads.
            Keep titles under 60 characters and descriptions under 160 for best results.
          </p>
        </div>
      </div>

      {PAGES.map(page => (
        <PageSeoForm
          key={page.key}
          page={page}
          initial={seoMap[page.key] || null}
          onSaved={load}
        />
      ))}
    </div>
  );
}