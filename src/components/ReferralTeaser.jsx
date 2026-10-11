import { motion } from "framer-motion";
import { Gift, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Zero-cost growth lever: promotes the existing referral program
// (awardReferralBonuses function) to turn happy visitors into advocates.
// Placed near other membership/loyalty CTAs at the bottom of the homepage.
export default function ReferralTeaser() {
  return (
    <section className="py-16 md:py-20 px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative bg-gradient-to-br from-foreground to-foreground/90 text-background"
      >
        {/* Decorative accent */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 mb-4">
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary">Refer & Earn</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3 leading-tight">
              Bring a Friend,<br />Earn Rewards
            </h2>
            <p className="font-body text-sm text-background/60 leading-relaxed mb-6 max-w-sm">
              Share JTAP Kitchen with your circle. When they book their first visit, you both earn loyalty points toward free dishes, events, and member perks.
            </p>
            <Link
              to="/loyalty"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Get Your Referral Link <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Visual */}
          <div className="flex items-center justify-center md:justify-end">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-background/10 border border-background/20 flex items-center justify-center backdrop-blur-sm">
                <Users className="w-9 h-9 text-primary" />
              </div>
              <div className="text-3xl font-heading font-bold text-primary">+</div>
              <div className="w-20 h-20 rounded-full bg-background/10 border border-background/20 flex items-center justify-center backdrop-blur-sm">
                <Gift className="w-9 h-9 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}