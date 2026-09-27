import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, TrendingDown, Minus, Trash2, Zap, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ACTION_STYLES = {
  "Scale Up": { chip: "bg-green-100 text-green-800 border-green-300", icon: TrendingUp },
  Hold: { chip: "bg-muted text-muted-foreground border-border", icon: Minus },
  Optimize: { chip: "bg-amber-100 text-amber-800 border-amber-300", icon: Zap },
  Pause: { chip: "bg-red-100 text-red-800 border-red-300", icon: TrendingDown },
};

const PRIORITY_STYLES = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-muted text-muted-foreground",
};

const STATUS_FLOW = ["New", "Acknowledged", "Applied"];

export default function AdsRecommendationsTab() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const data = await base44.entities.AdsRecommendation.list("-created_date", 100);
    setRecs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateAdsRecommendations", {});
      const d = res.data || {};
      if (d.generated > 0) toast.success(`${d.generated} recommendation${d.generated !== 1 ? "s" : ""} generated`);
      else toast.info(d.reason || "No new recommendations — make sure Meta Ads insights are synced.");
      load();
    } catch (err) {
      toast.error("Generation failed: " + (err.message || "unknown error"));
    }
    setGenerating(false);
  };

  const cycleStatus = async (rec) => {
    const next = STATUS_FLOW[(STATUS_FLOW.indexOf(rec.status || "New") + 1) % STATUS_FLOW.length];
    await base44.entities.AdsRecommendation.update(rec.id, { status: next });
    setRecs((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: next } : r)));
  };

  const remove = async (id) => {
    await base44.entities.AdsRecommendation.delete(id);
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

  const totalSpend = recs.reduce((s, r) => s + (Number(r.current_spend) || 0), 0);
  const byPriority = (p) => recs.filter((r) => r.priority === p).length;

  return (
    <div className="space-y-6">
      {/* Header + generate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Ads Optimization Agent
          </h3>
          <p className="font-body text-sm text-muted-foreground mt-0.5">Weekly AI analysis of Meta Ads spend vs. reservations — budget-shift recommendations to review.</p>
        </div>
        <button
          onClick={generateNow}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Analyzing…" : "Generate Now"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Recommendations</p>
          <p className="font-heading text-2xl font-bold">{recs.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Ad Spend Covered</p>
          <p className="font-heading text-2xl font-bold">${totalSpend.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">High Priority</p>
          <p className="font-heading text-2xl font-bold text-red-600">{byPriority("High")}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">New</p>
          <p className="font-heading text-2xl font-bold text-primary">{recs.filter((r) => r.status === "New").length}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : recs.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No recommendations yet. Click “Generate Now” to analyze your latest Meta Ads insights.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const a = ACTION_STYLES[rec.suggested_action] || ACTION_STYLES.Hold;
            const ActionIcon = a.icon;
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-body font-semibold text-foreground truncate">{rec.campaign_name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${a.chip} inline-flex items-center gap-1`}>
                      <ActionIcon className="w-3 h-3" /> {rec.suggested_action}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[rec.priority]}`}>{rec.priority}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-border text-muted-foreground">{rec.status}</span>
                  </div>
                  {rec.account_name && <p className="font-body text-xs text-muted-foreground mb-1">{rec.account_name}</p>}
                  <p className="font-body text-sm text-foreground mb-2">{rec.recommendation}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Spend covered: ${Number(rec.current_spend || 0).toFixed(2)}
                    {rec.generated_at && ` · Generated ${new Date(rec.generated_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => cycleStatus(rec)}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    Mark {STATUS_FLOW[(STATUS_FLOW.indexOf(rec.status || "New") + 1) % STATUS_FLOW.length]}
                  </button>
                  <button
                    onClick={() => remove(rec.id)}
                    className="px-3 py-1.5 text-xs font-semibold border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}