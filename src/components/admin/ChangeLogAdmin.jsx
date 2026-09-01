import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, X, Sparkles, Wrench, Bug, Palette,
  Bot, MessageSquare, FileText, Cpu, History, ScrollText
} from "lucide-react";

const CATEGORIES = ["Feature", "Improvement", "Fix", "Design"];
const AREAS = ["Reservations", "Events", "Marketing", "Loyalty", "Finance", "Operations", "Staff", "Infrastructure", "AI/Agents"];
const SOURCES = ["Manual", "Auto", "Retroactive"];
const PROMPT_TYPES = ["System Prompt", "Chat Prompt", "Caption Template", "LLM Prompt"];

const CAT_META = {
  Feature: { icon: Sparkles, chip: "bg-purple-100 text-purple-700" },
  Improvement: { icon: Wrench, chip: "bg-blue-100 text-blue-700" },
  Fix: { icon: Bug, chip: "bg-red-100 text-red-700" },
  Design: { icon: Palette, chip: "bg-amber-100 text-amber-700" },
};
const SOURCE_META = {
  Manual: "bg-muted text-muted-foreground",
  Auto: "bg-emerald-100 text-emerald-700",
  Retroactive: "bg-indigo-100 text-indigo-700",
};
const TYPE_META = {
  "System Prompt": { icon: Bot, chip: "bg-violet-100 text-violet-700" },
  "Chat Prompt": { icon: MessageSquare, chip: "bg-sky-100 text-sky-700" },
  "Caption Template": { icon: FileText, chip: "bg-amber-100 text-amber-700" },
  "LLM Prompt": { icon: Cpu, chip: "bg-rose-100 text-rose-700" },
};

const todayStr = () => new Date().toISOString().split("T")[0];

const EMPTY_ENTRY = {
  title: "", category: "Improvement", area: "Infrastructure", source: "Manual",
  summary: "", details: "", entry_date: todayStr(), version: "", is_published: true,
};
const EMPTY_PROMPT = {
  title: "", prompt_type: "System Prompt", source_feature: "", prompt_text: "",
  category: "", notes: "", is_active: true,
};

export default function ChangeLogAdmin() {
  const [view, setView] = useState("changes");
  const [entries, setEntries] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY);

  const [showPromptForm, setShowPromptForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [promptForm, setPromptForm] = useState(EMPTY_PROMPT);

  const setE = (k, v) => setEntryForm((f) => ({ ...f, [k]: v }));
  const setP = (k, v) => setPromptForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    try {
      const [e, p] = await Promise.all([
        base44.entities.ChangelogEntry.list("-entry_date", 300),
        base44.entities.AIPromptLog.list("-created_date", 300),
      ]);
      setEntries(e);
      setPrompts(p);
    } catch (err) {
      toast.error("Failed to load changelog");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewEntry = () => { setEditingEntry(null); setEntryForm({ ...EMPTY_ENTRY, entry_date: todayStr() }); setShowEntryForm(true); };
  const openEditEntry = (e) => { setEditingEntry(e); setEntryForm({ ...e }); setShowEntryForm(true); };

  const submitEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.title) { toast.error("Title is required"); return; }
    try {
      if (editingEntry?.id) {
        await base44.entities.ChangelogEntry.update(editingEntry.id, entryForm);
        toast.success("Entry updated");
      } else {
        await base44.entities.ChangelogEntry.create(entryForm);
        toast.success("Entry added");
      }
      setShowEntryForm(false); setEditingEntry(null);
      await load();
    } catch { toast.error("Failed to save entry"); }
  };

  const removeEntry = async (id) => {
    if (!confirm("Delete this changelog entry?")) return;
    await base44.entities.ChangelogEntry.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  };

  const openNewPrompt = () => { setEditingPrompt(null); setPromptForm({ ...EMPTY_PROMPT }); setShowPromptForm(true); };
  const openEditPrompt = (p) => { setEditingPrompt(p); setPromptForm({ ...p }); setShowPromptForm(true); };

  const submitPrompt = async (e) => {
    e.preventDefault();
    if (!promptForm.title) { toast.error("Title is required"); return; }
    try {
      if (editingPrompt?.id) {
        await base44.entities.AIPromptLog.update(editingPrompt.id, promptForm);
        toast.success("Prompt updated");
      } else {
        await base44.entities.AIPromptLog.create(promptForm);
        toast.success("Prompt added");
      }
      setShowPromptForm(false); setEditingPrompt(null);
      await load();
    } catch { toast.error("Failed to save prompt"); }
  };

  const removePrompt = async (id) => {
    if (!confirm("Delete this AI prompt log?")) return;
    await base44.entities.AIPromptLog.delete(id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prompt deleted");
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";
  const cardCls = "bg-card border border-border rounded-2xl p-5";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" /> Official ChangeLog
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            The single source of truth for app changes and AI prompts. Published entries show on the public "What's New" page.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "changes", label: "Changes", icon: History },
          { key: "prompts", label: "AI Prompts", icon: Bot },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm font-medium border-b-2 -mb-px transition-colors ${
              view === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
            <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {key === "changes" ? entries.length : prompts.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : view === "changes" ? (
        <div className="space-y-4">
          {!showEntryForm && (
            <button onClick={openNewEntry} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
              <Plus className="w-4 h-4" /> Log Change
            </button>
          )}

          {showEntryForm && (
            <form onSubmit={submitEntry} className={`${cardCls} space-y-4`}>
              <div className="flex items-center justify-between">
                <h4 className="font-heading text-base font-semibold">{editingEntry?.id ? "Edit" : "New"} Change</h4>
                <button type="button" onClick={() => { setShowEntryForm(false); setEditingEntry(null); }} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Title *</label>
                  <input className={inputCls} value={entryForm.title} onChange={(e) => setE("title", e.target.value)} required placeholder="Added same-day waitlist auto-notification" />
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Category</label>
                  <select className={inputCls} value={entryForm.category} onChange={(e) => setE("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">App Area</label>
                  <select className={inputCls} value={entryForm.area} onChange={(e) => setE("area", e.target.value)}>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Source</label>
                  <select className={inputCls} value={entryForm.source} onChange={(e) => setE("source", e.target.value)}>
                    {SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Entry Date</label>
                  <input type="date" className={inputCls} value={entryForm.entry_date || ""} onChange={(e) => setE("entry_date", e.target.value)} />
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Version Tag (optional)</label>
                  <input className={inputCls} value={entryForm.version || ""} onChange={(e) => setE("version", e.target.value)} placeholder="v2.4" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={entryForm.is_published} onChange={(e) => setE("is_published", e.target.checked)} className="w-4 h-4" />
                    <span className="font-body text-sm">Published</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Short Summary</label>
                  <input className={inputCls} value={entryForm.summary || ""} onChange={(e) => setE("summary", e.target.value)} placeholder="One-line description" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Details</label>
                  <textarea rows={4} className={`${inputCls} resize-none`} value={entryForm.details || ""} onChange={(e) => setE("details", e.target.value)} placeholder="What changed, why it matters, any notes..." />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save Entry</button>
                <button type="button" onClick={() => { setShowEntryForm(false); setEditingEntry(null); }} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
              </div>
            </form>
          )}

          {entries.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
              <p className="font-body text-sm text-muted-foreground">No changelog entries yet. Click "Log Change" to add your first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const meta = CAT_META[entry.category] || CAT_META.Improvement;
                const Icon = meta.icon;
                return (
                  <div key={entry.id} className={cardCls}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.chip}`}><Icon className="w-3 h-3" />{entry.category}</span>
                          {entry.area && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">{entry.area}</span>}
                          {entry.source && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SOURCE_META[entry.source] || SOURCE_META.Manual}`}>{entry.source}</span>}
                          <span className="font-body text-xs text-muted-foreground">{entry.entry_date}</span>
                          {entry.version && <span className="font-body text-xs text-muted-foreground">· {entry.version}</span>}
                          {!entry.is_published && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Draft</span>}
                        </div>
                        <h4 className="font-heading text-base font-semibold">{entry.title}</h4>
                        {entry.summary && <p className="font-body text-sm text-muted-foreground mt-0.5">{entry.summary}</p>}
                        {entry.details && <p className="font-body text-sm text-muted-foreground/80 mt-2 whitespace-pre-wrap">{entry.details}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditEntry(entry)} className="p-1.5 hover:text-primary transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => removeEntry(entry.id)} className="p-1.5 hover:text-destructive transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="font-body text-xs text-muted-foreground">
              AI Prompts are logged here as the official record. <strong>System Prompts</strong> & <strong>LLM Prompts</strong> are captured from the codebase; <strong>Chat Prompts</strong> (your requests to the assistant) and <strong>Caption Templates</strong> can be added manually — retroactive chat history isn't available, so log new prompts going forward.
            </p>
          </div>

          {!showPromptForm && (
            <button onClick={openNewPrompt} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
              <Plus className="w-4 h-4" /> Log AI Prompt
            </button>
          )}

          {showPromptForm && (
            <form onSubmit={submitPrompt} className={`${cardCls} space-y-4`}>
              <div className="flex items-center justify-between">
                <h4 className="font-heading text-base font-semibold">{editingPrompt?.id ? "Edit" : "New"} AI Prompt</h4>
                <button type="button" onClick={() => { setShowPromptForm(false); setEditingPrompt(null); }} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Title *</label>
                  <input className={inputCls} value={promptForm.title} onChange={(e) => setP("title", e.target.value)} required placeholder="Reservation assistant system prompt" />
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Prompt Type</label>
                  <select className={inputCls} value={promptForm.prompt_type} onChange={(e) => setP("prompt_type", e.target.value)}>
                    {PROMPT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Source Feature / File</label>
                  <input className={inputCls} value={promptForm.source_feature || ""} onChange={(e) => setP("source_feature", e.target.value)} placeholder="base44/agents/reservation_assistant.jsonc" />
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Category</label>
                  <input className={inputCls} value={promptForm.category || ""} onChange={(e) => setP("category", e.target.value)} placeholder="Agent / Social / Forecasting" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={promptForm.is_active} onChange={(e) => setP("is_active", e.target.checked)} className="w-4 h-4" />
                    <span className="font-body text-sm">Active</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Prompt Text</label>
                  <textarea rows={8} className={`${inputCls} resize-none font-mono text-xs`} value={promptForm.prompt_text || ""} onChange={(e) => setP("prompt_text", e.target.value)} placeholder="The full prompt text..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-muted-foreground mb-1 block">Notes</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} value={promptForm.notes || ""} onChange={(e) => setP("notes", e.target.value)} placeholder="When/why this prompt is used..." />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save Prompt</button>
                <button type="button" onClick={() => { setShowPromptForm(false); setEditingPrompt(null); }} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
              </div>
            </form>
          )}

          {prompts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
              <p className="font-body text-sm text-muted-foreground">No AI prompts logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((p) => {
                const meta = TYPE_META[p.prompt_type] || TYPE_META["System Prompt"];
                const Icon = meta.icon;
                return (
                  <div key={p.id} className={cardCls}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.chip}`}><Icon className="w-3 h-3" />{p.prompt_type}</span>
                          {p.category && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">{p.category}</span>}
                          {p.source_feature && <span className="font-body text-xs text-muted-foreground font-mono">{p.source_feature}</span>}
                          {!p.is_active && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Inactive</span>}
                        </div>
                        <h4 className="font-heading text-base font-semibold">{p.title}</h4>
                        {p.prompt_text && (
                          <pre className="mt-2 bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">{p.prompt_text}</pre>
                        )}
                        {p.notes && <p className="font-body text-xs text-muted-foreground/80 mt-2 italic">{p.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditPrompt(p)} className="p-1.5 hover:text-primary transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => removePrompt(p.id)} className="p-1.5 hover:text-destructive transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}