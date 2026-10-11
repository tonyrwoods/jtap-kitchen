import { motion } from "framer-motion";
import { Leaf, ChefHat, Crown } from "lucide-react";

// Three quick value propositions placed high on the homepage so visitors
// immediately see what sets JTAP apart before hitting the booking widgets.
const PROPS = [
  {
    icon: Leaf,
    title: "Farm-to-Table",
    blurb: "Seasonal ingredients sourced from local growers, harvested at peak freshness.",
  },
  {
    icon: ChefHat,
    title: "Chef-Crafted",
    blurb: "Every plate made from scratch — bold flavors rooted in culinary artistry.",
  },
  {
    icon: Crown,
    title: "Member Rewards",
    blurb: "Join the Tap Room Society and earn points, perks, and priority on every visit.",
  },
];

export default function ValuePropsStrip() {
  return (
    <section className="px-6 py-12 md:py-16 bg-background border-b border-border/60">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {PROPS.map(({ icon: Icon, title, blurb }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{blurb}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}