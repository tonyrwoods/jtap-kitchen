import { motion } from "framer-motion";
import { Leaf, Wheat, Fish, AlertCircle } from "lucide-react";

const ACCOMMODATIONS = [
  {
    icon: Leaf,
    label: "Vegetarian & Vegan",
    desc: "Plant-forward dishes across every course.",
  },
  {
    icon: Wheat,
    label: "Gluten-Free Options",
    desc: "Gluten-sensitive plates available on request.",
  },
  {
    icon: Fish,
    label: "Allergy Aware",
    desc: "Tell us about allergies — we'll guide your order.",
  },
  {
    icon: AlertCircle,
    label: "Chef Accommodations",
    desc: "Our kitchen adapts dishes whenever possible.",
  },
];

export default function DietaryAccommodations() {
  return (
    <section className="px-6 py-14 md:py-16 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Dietary Accommodations
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-3 mb-2 leading-tight">
            Every Guest, Welcome at Our Table
          </h2>
          <p className="font-body text-muted-foreground text-sm max-w-lg mx-auto">
            Have dietary needs? We've got you. Share your preferences when you book and our team will take care of the rest.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {ACCOMMODATIONS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="bg-card border border-border rounded-2xl p-5 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading text-sm font-bold text-foreground mb-1">{item.label}</h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}