import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";

function ReviewCard({ review }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-7 flex flex-col gap-4">
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

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Review.filter({ status: "Approved", is_featured: true }, "-created_date", 6)
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || reviews.length === 0) return null;

  return (
    <section id="reviews" className="py-20 md:py-28 px-6 lg:px-10 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Guest Reviews</p>
          <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground">What Our Guests Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
        <div className="text-center mt-10">
          <a href="/submit-review" className="inline-flex items-center px-6 py-3 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Share Your Experience
          </a>
        </div>
      </div>
    </section>
  );
}