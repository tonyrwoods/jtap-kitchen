import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Star, Quote, PenLine, Calendar } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function ReviewCard({ review, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="bg-card border border-border rounded-2xl p-7 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300 break-inside-avoid mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <Quote className="w-7 h-7 text-primary/15 shrink-0" />
      </div>
      <p className="font-body text-sm leading-relaxed text-foreground/90 flex-1">"{review.comment}"</p>
      <div className="pt-3 border-t border-border">
        <p className="font-body text-sm font-semibold text-foreground">{review.guest_name}</p>
        {review.visit_date && (
          <p className="font-body text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Visited {formatDate(review.visit_date)}
          </p>
        )}
      </div>
      {review.manager_response && (
        <div className="pt-4 border-t border-border">
          <p className="font-body text-xs font-semibold text-primary mb-1.5">Response from JTAP Kitchen</p>
          <p className="font-body text-xs text-muted-foreground leading-relaxed">{review.manager_response}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Guest Reviews — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Read featured guest reviews about dining experiences at JTAP Kitchen in Memphis.");
    base44.entities.Review.filter({ status: "Approved", is_featured: true }, "-created_date", 100)
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-secondary/30 pt-20">
      <div className="bg-foreground text-background py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">Guest Reviews</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-4">What Our Guests Say</h1>
          <p className="font-body text-background/60 text-base md:text-lg max-w-xl mx-auto">
            Real stories from guests who've dined at JTAP Kitchen. We're grateful for every visit.
          </p>
          {reviews.length > 0 && (
            <div className="mt-6 inline-flex items-center gap-3 bg-background/10 rounded-full px-5 py-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avg) ? "text-primary fill-primary" : "text-background/30"}`} />
                ))}
              </div>
              <span className="font-body text-sm font-semibold">{avg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-7 mb-6 animate-pulse space-y-4 break-inside-avoid">
                <div className="flex gap-1">{[...Array(5)].map((_, j) => <div key={j} className="w-4 h-4 bg-muted rounded" />)}</div>
                <div className="space-y-2"><div className="h-3 bg-muted rounded w-full" /><div className="h-3 bg-muted rounded w-4/5" /></div>
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <Quote className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-body text-muted-foreground">No featured reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {reviews.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
          </div>
        )}

        <div className="mt-12 text-center bg-card border border-border rounded-3xl p-8 md:p-12 max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-semibold mb-2">Share Your Experience</h2>
          <p className="font-body text-sm text-muted-foreground mb-6">Dined with us recently? We'd love to hear what you thought.</p>
          <Link to="/submit-review" className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-all">
            <PenLine className="w-4 h-4" /> Write a Review
          </Link>
        </div>
      </div>
    </div>
  );
}