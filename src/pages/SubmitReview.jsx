import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const GOLD = "#C89B4F";

function ReviewCard({ review }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-4 h-4 ${i <= review.rating ? "text-primary fill-primary" : "text-muted-foreground"}`} />
        ))}
      </div>
      <p className="font-body text-sm text-foreground leading-relaxed">"{review.comment}"</p>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
        <span className="font-body text-sm font-semibold text-foreground">{review.guest_name}</span>
        {review.visit_date && <span className="font-body text-xs text-muted-foreground">{review.visit_date}</span>}
      </div>
    </div>
  );
}

export default function SubmitReview() {
  const [form, setForm] = useState({ guest_name: "", email: "", rating: 0, comment: "", visit_date: "" });
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [member, setMember] = useState(null);

  useEffect(() => {
    document.title = "Share Your Experience — JTAP Kitchen Reviews";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Share your dining experience at JTAP Kitchen. Leave a review and read what other guests have to say about their visits.");
    base44.entities.Review.filter({ status: "Approved" }, "-created_date", 6).then(setApprovedReviews);
    // Check if logged-in user is a Tap Room Society member
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!authed) return;
      const user = await base44.auth.me();
      const members = await base44.entities.TapRoomMember.filter({ email: user.email });
      if (members[0]) {
        setMember(members[0]);
        setForm(f => ({ ...f, guest_name: members[0].guest_name || user.full_name || "", email: user.email || "" }));
      }
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) { toast.error("Please select a star rating."); return; }
    if (!form.comment.trim()) { toast.error("Please write a review."); return; }
    setLoading(true);
    const guestName = member ? `${form.guest_name} ⭐ ${member.tier}` : form.guest_name;
    await base44.functions.invoke("submitReview", {
      guest_name: guestName,
      email: form.email,
      rating: form.rating,
      comment: form.comment,
      visit_date: form.visit_date,
    });
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

      {/* Approved Reviews Section */}
      {approvedReviews.length > 0 && (
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-8">
            <p className="font-body text-xs uppercase tracking-widest text-primary font-semibold mb-2">Guest Experiences</p>
            <h2 className="font-heading text-3xl font-bold">What Our Guests Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {approvedReviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Share Your Experience</p>
          <h1 className="font-heading text-4xl font-semibold mb-3">Leave a Review</h1>
          <p className="font-body text-muted-foreground">We'd love to hear about your visit to JTAP Kitchen.</p>
        </div>

        {member && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl px-5 py-3 mb-6"
            style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>
            <Crown className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
            <div>
              <p className="font-body text-sm font-bold" style={{ color: GOLD }}>Tap Room Society Member — {member.tier}</p>
              <p className="font-body text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>Your info is pre-filled. Your tier will be noted on your review.</p>
            </div>
          </motion.div>
        )}

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