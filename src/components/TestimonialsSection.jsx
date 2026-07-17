import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Send, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ReviewCard({ review }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-7 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-primary fill-primary" : "text-muted-foreground"}`} />
        ))}
      </div>
      <p className="font-body text-sm leading-relaxed text-muted-foreground flex-1">"{review.comment}"</p>
      <div>
        <p className="font-body text-sm font-semibold text-foreground">{review.guest_name}</p>
        {review.visit_date && <p className="font-body text-xs text-muted-foreground mt-0.5">{review.visit_date}</p>}
      </div>
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < (hovered || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${i + 1} star${i + 1 > 1 ? "s" : ""}`}
            className="transition-transform hover:scale-110"
          >
            <Star className={`w-7 h-7 transition-colors ${filled ? "text-primary fill-primary" : "text-border hover:text-primary"}`} />
          </button>
        );
      })}
    </div>
  );
}

function SubmitReviewForm({ onSubmitted }) {
  const [form, setForm] = useState({ guest_name: "", email: "", rating: 0, comment: "", visit_date: "" });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) return;
    setSubmitting(true);
    await base44.entities.Review.create({ ...form, status: "Pending" });
    setSubmitting(false);
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-2">Your Name *</label>
          <input
            required
            value={form.guest_name}
            onChange={e => set("guest_name", e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-4 py-3 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-2">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            placeholder="you@email.com"
            className="w-full px-4 py-3 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-2">Visit Date</label>
        <input
          type="date"
          value={form.visit_date}
          onChange={e => set("visit_date", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-3">Your Rating *</label>
        <StarRatingInput value={form.rating} onChange={v => set("rating", v)} />
        {form.rating === 0 && <p className="font-body text-xs text-muted-foreground mt-1">Please select a rating</p>}
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-2">Your Review *</label>
        <textarea
          required
          value={form.comment}
          onChange={e => set("comment", e.target.value)}
          placeholder="Tell us about your experience..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || form.rating === 0}
        className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    base44.entities.Review.filter({ status: "Approved", is_featured: true }, "-created_date", 6)
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="reviews" className="py-20 md:py-28 px-6 lg:px-10 bg-secondary/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Guest Reviews</p>
          <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground mb-4">What Our Guests Say</h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto text-sm">
            Every visit matters to us. Read what our guests have to say, or share your own experience.
          </p>
        </div>

        {/* Review Cards */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-7 animate-pulse space-y-4">
                <div className="flex gap-1">{[...Array(5)].map((_, j) => <div key={j} className="w-4 h-4 bg-muted rounded" />)}</div>
                <div className="space-y-2"><div className="h-3 bg-muted rounded w-full" /><div className="h-3 bg-muted rounded w-4/5" /></div>
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* CTA + Form */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">Thank You!</h3>
                <p className="font-body text-muted-foreground text-sm">Your review has been submitted and is pending approval. We appreciate your feedback!</p>
                <button
                  onClick={() => { setSubmitted(false); setShowForm(false); }}
                  className="mt-6 px-6 py-2.5 border border-border rounded-full font-body text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </motion.div>
            ) : !showForm ? (
              <motion.div
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">Share Your Experience</h3>
                <p className="font-body text-muted-foreground text-sm mb-6">
                  Dined with us recently? We'd love to hear what you thought.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Write a Review
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading text-2xl font-semibold text-foreground">Write a Review</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="font-body text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <SubmitReviewForm onSubmitted={() => setSubmitted(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}