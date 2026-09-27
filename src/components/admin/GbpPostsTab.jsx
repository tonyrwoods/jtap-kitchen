import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Copy, Check, Trash2, RefreshCw, ExternalLink, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STATUS_FLOW = ["Draft", "Posted", "Skipped"];
const STATUS_STYLES = {
  Draft: "bg-muted text-muted-foreground",
  Posted: "bg-green-100 text-green-800",
  Skipped: "bg-muted/60 text-muted-foreground line-through",
};

export default function GbpPostsTab() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = async () => {
    const data = await base44.entities.GbpPostDraft.list("-created_date", 100);
    setDrafts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("draftGbpPosts", {});
      const d = res.data || {};
      if (d.drafted > 0) toast.success(`${d.drafted} post${d.drafted !== 1 ? "s" : ""} drafted`);
      else toast.info(d.total === 0 ? "All upcoming events already have drafts." : "No upcoming events to post.");
      load();
    } catch (err) {
      toast.error("Generation failed: " + (err.message || "unknown error"));
    }
    setGenerating(false);
  };

  const cycleStatus = async (d) => {
    const next = STATUS_FLOW[(STATUS_FLOW.indexOf(d.status || "Draft") + 1) % STATUS_FLOW.length];
    await base44.entities.GbpPostDraft.update(d.id, { status: next });
    setDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: next } : x)));
  };

  const remove = async (id) => {
    await base44.entities.GbpPostDraft.delete(id);
    setDrafts((prev) => prev.filter((x) => x.id !== id));
  };

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> GBP Post Agent
          </h3>
          <p className="font-body text-sm text-muted-foreground mt-0.5">Drafts ready-to-paste Google Business Profile posts for upcoming events. Copy each draft into your GBP dashboard.</p>
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No GBP post drafts yet. Click “Generate Now” to draft posts for upcoming events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h4 className="font-body font-semibold text-foreground">{d.promotion_title}</h4>
                {d.event_date && (
                  <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground">
                    <CalendarDays className="w-3 h-3" /> {d.event_date}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[d.status] || STATUS_STYLES.Draft}`}>{d.status}</span>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-4 mb-3 relative">
                <p className="font-body text-sm text-foreground whitespace-pre-wrap pr-8">{d.post_text}</p>
                <button
                  onClick={() => copy(d.id, d.post_text)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-background border border-border"
                  aria-label="Copy post text"
                >
                  {copied === d.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body text-xs text-muted-foreground">CTA: <strong className="text-foreground">{d.cta_label}</strong></span>
                {d.share_url && (
                  <a href={d.share_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-body text-xs text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" /> Event link
                  </a>
                )}
                <div className="flex-1" />
                <button onClick={() => cycleStatus(d)} className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                  Mark {STATUS_FLOW[(STATUS_FLOW.indexOf(d.status || "Draft") + 1) % STATUS_FLOW.length]}
                </button>
                <button onClick={() => remove(d.id)} className="p-2 text-xs font-semibold border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}