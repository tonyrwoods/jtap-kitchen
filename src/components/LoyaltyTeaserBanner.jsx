import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, ChevronRight } from "lucide-react";

// Promotional banner cross-selling the Tap Room Society loyalty program.
// Sits near the bottom of the homepage to catch engaged scrollers.
export default function LoyaltyTeaserBanner() {
  return (
    <section className="px-6 py-16 md:py-20 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground to-primary/90 px-8 py-12 md:px-14 md:py-16"
        >
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-body text-xs uppercase tracking-[0.25em] text-primary font-semibold">Tap Room Society</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-background mb-3 leading-tight">
                Become a Member. Earn While You Dine.
              </h2>
              <p className="font-body text-sm md:text-base text-background/70 max-w-lg leading-relaxed">
                Join our loyalty society to earn points on every visit, unlock member-only events, and enjoy priority reservations. Membership has its privileges.
              </p>
            </div>
            <Link
              to="/tap-room-society"
              className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
            >
              Join Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}