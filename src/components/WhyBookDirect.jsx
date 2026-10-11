import { motion } from "framer-motion";
import { BadgeCheck, Zap, Crown, ShieldCheck } from "lucide-react";

const PERKS = [
  {
    icon: BadgeCheck,
    title: "No Third-Party Fees",
    desc: "Book direct and skip the markup apps add on top of your meal.",
  },
  {
    icon: Zap,
    title: "Instant Confirmation",
    desc: "Your table is confirmed immediately — no waiting on a middleman.",
  },
  {
    icon: Crown,
    title: "Earn Loyalty Points",
    desc: "Every direct booking earns Tap Room Society points toward rewards.",
  },
  {
    icon: ShieldCheck,
    title: "Flexible Changes",
    desc: "Need to adjust your party size or time? Talk to us directly, anytime.",
  },
];

export default function WhyBookDirect() {
  return (
    <section className="px-6 py-16 md:py-20 bg-muted/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Skip the Apps
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3 mb-3 leading-tight">
            Why Book Direct With Us
          </h2>
          <p className="font-body text-muted-foreground text-base max-w-lg mx-auto">
            Booking directly with JTAP Kitchen means a better experience and real perks — no app required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <perk.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground mb-2">{perk.title}</h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}