import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Trash2, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StarRating from "@/components/scorecards/StarRating";

function ResponseModal({ card, onClose, onSave }) {
  const [response, setResponse] = useState(card.manager_response || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.PromotionScorecard.update(card.id, { manager_response: response });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold">Respond to Scorecard</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="font-body text-xs text-muted-foreground mb-1">From <strong>{card.guest_name}</strong></p>
          <p className="font-body text-sm italic text-foreground">"{card.comment || "No comment provided."}"</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-2 block">Your Response *</label>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none"
              rows={4}
              placeholder="Thank you for your feedback..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg font-body text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">Save</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function PromotionScorecardsTab() {
  const [cards, setCards] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [respondingTo, setRespondingTo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    const data = await base44.entities.PromotionScorecard.list("-created_date", 200);
    setCards(data);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const filtered = filter === "all"
    ? cards
    : filter === "pending"
      ? cards.filter((c) => c.status === "Pending")
      : filter === "approved"
        ? cards.filter((c) => c.status === "Approved")
        : cards.filter((c) => c.status === "Rejected");

  const updateStatus = async (id, status) => {
    await base44.entities.PromotionScorecard.update(id, { status });
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const deleteCard = async (id) => {
    if (!confirm("Delete this scorecard? This cannot be undone.")) return;
    await base44.entities.PromotionScorecard.delete(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleFeatured = async (card) => {
    await base44.entities.PromotionScorecard.update(card.id, { is_featured: !card.is_featured });
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, is_featured: !c.is_featured } : c)));
  };

  const pendingCount = cards.filter((c) => c.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Total Scorecards</p>
          <p className="font-heading text-3xl font-bold text-foreground">{cards.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Pending Review</p>
          <p className="font-heading text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Approved</p>
          <p className="font-heading text-3xl font-bold text-green-600">{cards.filter((c) => c.status === "Approved").length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-body text-sm font-medium transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No scorecards in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((card) => {
            const _ratings = [
              Number(card.dishes_rating), Number(card.presentation_rating),
              Number(card.service_rating), Number(card.atmosphere_rating),
              Number(card.value_rating), Number(card.hospitality_rating),
            ].filter((n) => n > 0);
            const overall = _ratings.length ? _ratings.reduce((s, n) => s + n, 0) / _ratings.length : 0;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div>
                      <h4 className="font-heading text-sm font-semibold text-foreground">{card.guest_name}</h4>
                      <p className="font-body text-xs text-muted-foreground">
                        {card.email || "No email"}{card.promotion_title ? ` · ${card.promotion_title}` : ""}
                      </p>
                      {card.visit_date && (
                        <p className="font-body text-xs text-muted-foreground">Visited {new Date(card.visit_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-heading text-sm font-bold text-primary">{overall.toFixed(1)}</span>
                      <StarRating value={Math.round(overall)} size="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2 text-xs">
                    {[
                      { label: "Dishes", val: card.dishes_rating },
                      { label: "Presentation", val: card.presentation_rating },
                      { label: "Service", val: card.service_rating },
                      { label: "Atmosphere", val: card.atmosphere_rating },
                      { label: "Value", val: card.value_rating },
                      { label: "Hospitality", val: card.hospitality_rating },
                    ].filter((r) => Number(r.val) > 0).map((r) => (
                      <span key={r.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                        {r.label} <strong className="text-foreground">{r.val}</strong>
                      </span>
                    ))}
                  </div>

                  {card.favorite_dish && (
                    <p className="font-body text-xs text-primary font-medium mb-2">★ Favorite dish: {card.favorite_dish}</p>
                  )}

                  {card.comment && (
                    <p className="font-body text-sm text-foreground mb-2">"{card.comment}"</p>
                  )}

                  {card.manager_response && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-3 border-l-2 border-primary">
                      <p className="font-body text-xs font-semibold text-primary mb-1">Your Response:</p>
                      <p className="font-body text-sm text-foreground">{card.manager_response}</p>
                    </div>
                  )}

                  {card.is_featured && (
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">★ Featured</span>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-2 shrink-0 items-center lg:items-end">
                  <select
                    value={card.status || "Pending"}
                    onChange={(e) => updateStatus(card.id, e.target.value)}
                    className="border border-border rounded-lg px-3 py-1.5 text-xs bg-background font-body"
                  >
                    {["Pending", "Approved", "Rejected"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {card.status === "Approved" && (
                    <>
                      <button
                        onClick={() => toggleFeatured(card)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          card.is_featured ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                        }`}
                      >
                        {card.is_featured ? "★ Featured" : "Feature"}
                      </button>
                      <button
                        onClick={() => setRespondingTo(card)}
                        className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> {card.manager_response ? "Edit" : "Respond"}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => deleteCard(card.id)}
                    className="px-3 py-1.5 text-xs font-semibold border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {respondingTo && (
          <ResponseModal
            card={respondingTo}
            onClose={() => setRespondingTo(null)}
            onSave={() => { setRespondingTo(null); fetchCards(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}