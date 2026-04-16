import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Send, Trash2, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ResponseModal({ feedback, onClose, onSave }) {
  const [response, setResponse] = useState(feedback.manager_response || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Review.update(feedback.id, {
      manager_response: response,
      response_date: new Date().toISOString(),
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold">Respond to Feedback</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="font-body text-xs text-muted-foreground mb-1">From <strong>{feedback.guest_name}</strong></p>
          <p className="font-body text-sm italic text-foreground">"{feedback.comment}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-2 block">Your Response *</label>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none"
              rows={4}
              placeholder="Thank you for your feedback..."
              value={response}
              onChange={e => setResponse(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg font-body text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {saving ? "Sending..." : "Send Response"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function FeedbackManagementTab() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [respondingTo, setRespondingTo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Review.list("-created_date", 100).then(data => {
      setReviews(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all"
    ? reviews
    : filter === "pending"
      ? reviews.filter(r => r.status === "Pending")
      : filter === "approved"
        ? reviews.filter(r => r.status === "Approved")
        : reviews.filter(r => r.status === "Rejected");

  const updateStatus = async (id, status) => {
    await base44.entities.Review.update(id, { status });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteReview = async (id) => {
    await base44.entities.Review.delete(id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveResponse = () => {
    setRespondingTo(null);
    base44.entities.Review.list("-created_date", 100).then(setReviews);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Total Feedback</p>
          <p className="font-heading text-3xl font-bold text-foreground">{reviews.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Pending Review</p>
          <p className="font-heading text-3xl font-bold text-yellow-600">{reviews.filter(r => r.status === "Pending").length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Avg. Rating</p>
          <p className="font-heading text-3xl font-bold text-primary">
            {reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "—"}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-body text-sm font-medium transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No feedback in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-foreground">{review.guest_name}</h4>
                    <p className="font-body text-xs text-muted-foreground">
                      {review.email} · {review.visit_date ? new Date(review.visit_date).toLocaleDateString() : "No date"}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="font-body text-sm text-foreground mb-2">"{review.comment}"</p>

                {review.manager_response && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-3 border-l-2 border-primary">
                    <p className="font-body text-xs font-semibold text-primary mb-1">Your Response:</p>
                    <p className="font-body text-sm text-foreground">{review.manager_response}</p>
                  </div>
                )}

                {review.is_featured && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary mb-3">
                    ★ Featured
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <select
                  value={review.status || "Pending"}
                  onChange={e => updateStatus(review.id, e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-xs bg-background font-body"
                >
                  {["Pending", "Approved", "Rejected"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {review.status === "Approved" && !review.manager_response && (
                  <button
                    onClick={() => setRespondingTo(review)}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Respond
                  </button>
                )}

                {review.status === "Approved" && (
                  <button
                    onClick={async () => {
                      await base44.entities.Review.update(review.id, { is_featured: !review.is_featured });
                      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_featured: !r.is_featured } : r));
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      review.is_featured
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {review.is_featured ? "★ Featured" : "Feature"}
                  </button>
                )}

                <button
                  onClick={() => deleteReview(review.id)}
                  className="px-3 py-1.5 text-xs font-semibold border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {respondingTo && (
          <ResponseModal
            feedback={respondingTo}
            onClose={() => setRespondingTo(null)}
            onSave={handleSaveResponse}
          />
        )}
      </AnimatePresence>
    </div>
  );
}