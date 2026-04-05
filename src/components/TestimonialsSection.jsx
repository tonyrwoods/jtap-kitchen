import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Victoria Chen",
    role: "Food Critic, Metro Weekly",
    text: "Aurelian redefines fine dining. The truffle tagliatelle alone is worth the visit — it's a symphony of textures and flavors that lingers long after the last bite.",
    rating: 5,
  },
  {
    name: "James Whitfield",
    role: "Regular Guest",
    text: "We've celebrated every anniversary here for the past five years. The service is impeccable, the ambiance is romantic, and the food is consistently extraordinary.",
    rating: 5,
  },
  {
    name: "Sofia Ramirez",
    role: "Michelin Guide Contributor",
    text: "A hidden gem that deserves every accolade. Chef Laurent's ability to balance bold flavors with delicate precision is nothing short of remarkable.",
    rating: 5,
  },
];

function ReviewCard({ review, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="bg-card border border-border rounded-3xl p-8 md:p-10 relative"
    >
      <Quote className="w-10 h-10 text-primary/15 absolute top-8 right-8" />
      <div className="flex gap-1 mb-5">
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-primary fill-primary" />
        ))}
      </div>
      <p className="font-body text-foreground text-base leading-relaxed mb-8">
        "{review.text}"
      </p>
      <div>
        <p className="font-heading text-lg font-semibold text-foreground">{review.name}</p>
        <p className="font-body text-sm text-muted-foreground">{review.role}</p>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="py-24 md:py-32 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Testimonials
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-5">
            Words From Our Guests
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Don't just take our word for it — hear what our guests have to say
            about their experience at Aurelian.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {REVIEWS.map((review, i) => (
            <ReviewCard key={review.name} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}