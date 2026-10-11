import { motion } from "framer-motion";
import { Star, UtensilsCrossed, Users, MapPin } from "lucide-react";

// Thin credibility strip with key stats. Placed high on the homepage
// right after the value props to reinforce trust before the booking widgets.
const STATS = [
  { icon: Star, value: "5.0", label: "Guest Rating" },
  { icon: UtensilsCrossed, value: "100%", label: "Scratch Kitchen" },
  { icon: Users, value: "80", label: "Seats Available" },
  { icon: MapPin, value: "Memphis", label: "Summer Ave" },
];

export default function StatsBar() {
  return (
    <section className="bg-foreground py-6 md:py-8">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3 justify-center md:justify-start">
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <div className="leading-tight">
                <div className="font-heading text-xl md:text-2xl font-bold text-background">{value}</div>
                <div className="font-body text-xs text-background/50 uppercase tracking-wider">{label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}