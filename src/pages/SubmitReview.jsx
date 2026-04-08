import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function SubmitReview() {
  const [form, setForm] = useState({ guest_name: "", email: "", rating: 0, comment: "", visit_date: "" });
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) { toast.error("Please select a star rating."); return; }
    setLoading(true);
    await base44.entities.Review.create({ ...form, status: "Pending", is_featured: false });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-8 h-8 text-primary fill-primary" />)}
          </div>
          <h2 className="font-heading text-3xl font-semibold mb-3">Thank You!</h2>
          <p className="font-body text-muted-foreground mb-6">Your review has been submitted and is pending approval. We truly appreciate your feedback.</p>
          <a href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Share Your Experience</p>
          <h1 className="font-heading text-4xl font-semibold mb-3">Leave a Review</h1>
          <p className="font-body text-muted-foreground">We'd love to hear about your visit to JTAP Kitchen.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="font-body text-sm text-muted-foreground mb-2 block">Your Rating *</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => set("rating", star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-9 h-9 transition-colors ${star <= (hover || form.rating) ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">Your Name *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.guest_name} onChange={e => set("guest_name", e.target.value)} required />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">Email (optional)</label>
              <input type="email" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="font-body text-sm text-muted-foreground mb-1.5 block">Visit Date (optional)</label>
            <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.visit_date} onChange={e => set("visit_date", e.target.value)} />
          </div>

          <div>
            <label className="font-body text-sm text-muted-foreground mb-1.5 block">Your Review *</label>
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none" rows={5} placeholder="Tell us about your experience..." value={form.comment} onChange={e => set("comment", e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
            {loading ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}