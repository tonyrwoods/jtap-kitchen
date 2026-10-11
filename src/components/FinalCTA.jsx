import { motion } from "framer-motion";
import { Calendar, UtensilsCrossed, Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Closing call-to-action near the bottom of the homepage.
// Captures users who've scrolled through everything with one final,
// clear set of actions before they reach the footer.
const ACTIONS = [
  { icon: Calendar, label: "Reserve a Table", href: "/book", primary: true },
  { icon: UtensilsCrossed, label: "View Menu", href: "/menu" },
  { icon: Gift, label: "Gift Cards", href: "/gift-cards" },
];

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 px-6 lg:px-10 bg-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto text-center"
      >
        <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
          Your Table Awaits
        </span>
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4 leading-tight">
          Ready to Experience<br />JTAP Kitchen?
        </h2>
        <p className="font-body text-muted-foreground text-base max-w-lg mx-auto mb-10 leading-relaxed">
          Bold flavors, warm hospitality, and an atmosphere you'll want to come back to. Book your table, explore the menu, or share JTAP with a gift card.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {ACTIONS.map(({ icon: Icon, label, href, primary }) => (
            <Link
              key={label}
              to={href}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-body text-sm font-semibold transition-all shadow-lg ${
                primary
                  ? "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90"
                  : "bg-card border border-border text-foreground hover:bg-secondary shadow-sm"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {primary && <ArrowRight className="w-4 h-4" />}
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  );
}