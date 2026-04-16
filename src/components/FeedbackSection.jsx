import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackSection() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Review.filter({ status: "Approved" }, "-created_date", 6).then(data => {
      setFeedback(data);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (feedback.length === 0) return null;

  const avgRating = (feedback.reduce((sum, r) => sum + r.rating, 0) / feedback.length).toFixed(1);

  return (
    <section className="py-24 md:py-32 px-6 lg:px-10 bg-foreground text-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">Guest Testimonials</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-4">What Our Guests Say</h2>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-heading text-3xl font-bold">{avgRating}</span>
            <span className="font-body text-sm text-background/60">Based on {feedback.length} reviews</span>
          </div>
        </div>

        {/* Feedback Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {feedback.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-background/10 backdrop-blur-sm border border-background/20 rounded-2xl p-6 hover:bg-background/20 transition-all"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`w-4 h-4 ${j < item.rating ? "text-yellow-400 fill-yellow-400" : "text-background/30"}`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="font-body text-sm leading-relaxed mb-4 italic">"{item.comment}"</p>

              {/* Author */}
              <div className="border-t border-background/20 pt-4">
                <p className="font-body font-semibold text-sm">{item.guest_name}</p>
                {item.visit_date && (
                  <p className="font-body text-xs text-background/60">
                    Visited {new Date(item.visit_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Manager Response */}
              {item.manager_response && (
                <div className="mt-4 pt-4 border-t border-background/20">
                  <p className="font-body text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Our Response
                  </p>
                  <p className="font-body text-xs text-background/80">{item.manager_response}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="font-body text-background/60 mb-4">Have you dined with us? We'd love to hear from you.</p>
          <a
            href="/submit-review"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Leave a Review <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}