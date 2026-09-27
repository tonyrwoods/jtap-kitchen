import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Copy, Check, Trash2, RefreshCw, Eye, CheckCircle2, Code } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STATUS_FLOW = ["Draft", "Applied", "Skipped"];
const STATUS_STYLES = {
  Draft: "bg-muted text-muted-foreground",
  Applied: "bg-green-100 text-green-800",
  Skipped: "bg-muted/60 text-muted-foreground line-through",
};

function Field({ label, value, mono }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="bg-muted/40 border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <button
          onClick={async () => {
            try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }
            catch { toast.error("Couldn't copy"); }
          }}
          className="p-1 rounded hover:bg-background border border-border"
        >
          {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
        </button>
      </div>
      <p className={`font-body text-sm text-foreground whitespace-pre-wrap ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

export default function SeoContentDraftsTab() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    const data = await base44.entities.SeoContentDraft.list("-created_date", 100);
    setDrafts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("draftSeoContent", {});
      const d = res.data || {};
      if (d.drafted > 0) toast.success(`${d.drafted} draft${d.drafted !== 1 ? "s" : ""} generated`);
      else toast.info(d.total === 0 ? "All upcoming events already have SEO drafts." : "No upcoming events to draft.");
      load();
    } catch (err) {
      toast.error("Generation failed: " + (err.message || "unknown error"));
    }
    setGenerating(false);
  };

  const setStatus = async (d, status) => {
    await base44.entities.SeoContentDraft.update(d.id, { status });
    setDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, status } : x)));
    if (status === "Applied") toast.success("Applied — live event page now uses this SEO content.");
  };

  const remove = async (id) => {
    await base44.entities.SeoContentDraft.delete(id);
    setDrafts((prev) => prev.filter((x) => x.id !== id));
  };

  const applied = drafts.filter((d) => d.status === "Applied").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> Event SEO Agent
          </h3>
          <p className="font-body text-sm text-muted-foreground mt-0.5">Generates SEO titles, meta, and JSON-LD for each event landing page. Mark a draft “Applied” to push it live on the event page.</p>
        </div>
        <button
          onClick={generateNow}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Drafting…" : "Generate Now"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Drafts</p>
          <p className="font-heading text-2xl font-bold">{drafts.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Applied Live</p>
          <p className="font-heading text-2xl font-bold text-green-600">{applied}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Pending</p>
          <p className="font-heading text-2xl font-bold text-primary">{drafts.filter((d) => d.status === "Draft").length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No SEO drafts yet. Click “Generate Now” to draft SEO content for upcoming events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => {
            const open = expanded === d.id;
            return (
              <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h4 className="font-body font-semibold text-foreground">{d.promotion_title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[d.status] || STATUS_STYLES.Draft}`}>{d.status}</span>
                  {d.status === "Applied" && (
                    <span className="inline-flex items-center gap-1 font-body text-xs text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Live on event page
                    </span>
                  )}
                  <div className="flex-1" />
                  <button onClick={() => setExpanded(open ? null : d.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-colors">
                    <Eye className="w-3.5 h-3.5" /> {open ? "Hide" : "Preview"}
                  </button>
                  {d.status !== "Applied" && (
                    <button onClick={() => setStatus(d, "Applied")} className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Apply
                    </button>
                  )}
                  {d.status === "Applied" && (
                    <button onClick={() => setStatus(d, "Draft")} className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-colors">
                      Unapply
                    </button>
                  )}
                  <button onClick={() => remove(d.id)} className="p-2 text-xs font-semibold border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="SEO Title" value={d.seo_title} />
                  <Field label="Meta Description" value={d.meta_description} />
                  <Field label="OG Title" value={d.og_title} />
                  <Field label="OG Description" value={d.og_description} />
                  <Field label="H1" value={d.h1} />
                  <Field label="Keywords" value={d.keywords} />
                </div>

                {d.body_intro && (
                  <div className="mt-3">
                    <Field label="SEO Intro Paragraph" value={d.body_intro} />
                  </div>
                )}

                {open && d.json_ld && (
                  <div className="mt-3">
                    <div className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto">
                      <div className="flex items-center gap-1.5 mb-2 text-slate-400 text-xs">
                        <Code className="w-3.5 h-3.5" /> JSON-LD (injected when Applied)
                      </div>
                      <pre className="font-mono text-xs whitespace-pre-wrap">{(() => {
                        try { return JSON.stringify(JSON.parse(d.json_ld), null, 2); } catch { return d.json_ld; }
                      })()}</pre>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}