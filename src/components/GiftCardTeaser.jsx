import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, ChevronRight } from "lucide-react";

// Promotes digital gift cards — pure-margin revenue with zero marginal cost.
// Placed near the bottom of the homepage alongside other conversion CTAs.
export default function GiftCardTeaser() {
  return (
    <section className="px-6 py-12 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl px-8 py-10 md:px-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-1">Give the Gift of Dining</h3>
            <p className="font-body text-sm text-muted-foreground">
              Digital gift cards delivered instantly — perfect for any occasion.
            </p>
          </div>
          <Link
            to="/gift-cards"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Buy Gift Cards <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}