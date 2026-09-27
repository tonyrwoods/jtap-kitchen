import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Plus, Wine } from "lucide-react";

// Reusable AI complementary-items suggestion panel. Shown when a guest is
// finalizing a reservation or event order. `onAdd(item)` is called when the
// guest adds a suggestion; the parent decides how to record it.
export default function ComplementarySuggestions({ contextItems = [], partySize = 2, flow = "reservation", selectedIds = [], onAdd }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      base44.functions.invoke("suggestComplementaryItems", { context_items: contextItems, party_size: partySize, flow })
        .then((res) => { if (!cancelled) setSuggestions(res.data?.suggestions || []); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [JSON.stringify(contextItems), partySize, flow]);

  const visible = suggestions.filter((s) => !selectedIds.includes(s.id) && !added.has(s.id));

  if (loading && visible.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <span className="font-body text-xs text-muted-foreground">Finding perfect pairings…</span>
      </div>
    );
  }
  if (visible.length === 0) return null;

  const handleAdd = (s) => {
    onAdd?.(s);
    setAdded((prev) => new Set(prev).add(s.id));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-body text-sm font-semibold text-foreground">Pairs perfectly with your {flow === "event" ? "event" : "reservation"}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visible.map((s) => (
          <div key={`${s.source}-${s.id}`} className="border border-border rounded-xl p-3 flex flex-col bg-card">
            <div className="flex items-start gap-2 mb-1">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
              ) : s.source === "liquor" ? (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Wine className="w-5 h-5 text-primary" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground leading-tight">{s.name}</p>
                <p className="font-body text-xs text-muted-foreground">{s.category} · ${Number(s.price).toFixed(2)}</p>
              </div>
            </div>
            <p className="font-body text-xs text-muted-foreground italic mb-3 flex-1">{s.reason}</p>
            <button
              type="button"
              onClick={() => handleAdd(s)}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-body text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}