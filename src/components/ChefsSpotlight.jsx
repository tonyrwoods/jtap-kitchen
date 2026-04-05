import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Wine, Leaf, ChefHat, Sparkles } from "lucide-react";

const SPOTLIGHT = {
  dish: "Rack of Lamb Provençal",
  tagline: "Tonight's Signature Creation",
  story: `This dish was born from a summer evening in Provence, where Chef Laurent sat beneath an ancient lavender field with his grandmother, watching her slow-roast lamb over a wood fire. The memory of that smoky sweetness — mingling with wild rosemary and warm hillside air — never left him. Every service, this plate is his love letter to that moment.`,
  chefNote: `"I want every guest to close their eyes and feel that warm Provençal sun. The lamb must rest perfectly — that's where the magic lives."`,
  ingredients: [
    { name: "Rack of Lamb", detail: "New Zealand grass-fed, frenched & trimmed", icon: "🥩" },
    { name: "Herbes de Provence Crust", detail: "Rosemary, thyme, lavender, oregano & breadcrumbs", icon: "🌿" },
    { name: "Rosemary Jus", detail: "24-hour veal reduction with fresh rosemary & red wine", icon: "🫙" },
    { name: "Roasted Garlic Confit", detail: "Slow-roasted 90 mins in extra virgin olive oil", icon: "🧄" },
    { name: "Pommes Dauphinoise", detail: "Gruyère-layered potato gratin with fresh cream", icon: "🥔" },
    { name: "Haricots Verts", detail: "French green beans blanched & finished in herb butter", icon: "🫛" },
  ],
  wine: {
    name: "Château Pichon Baron 2018",
    region: "Pauillac, Bordeaux, France",
    notes: "Full-bodied with cassis, cedar, and graphite. Its structured tannins and long finish mirror the rich, herbaceous character of the lamb beautifully.",
    pairingReason: "The wine's earthy complexity and dark fruit cut through the lamb's richness, while the oak-aged depth complements the rosemary jus.",
  },
};

function IngredientCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="flex items-start gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3.5"
    >
      <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
      <div>
        <p className="font-body text-sm font-semibold text-white leading-tight">{item.name}</p>
        <p className="font-body text-xs text-white/55 mt-0.5 leading-relaxed">{item.detail}</p>
      </div>
    </motion.div>
  );
}

export default function ChefsSpotlight() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-36 overflow-hidden bg-[#0f0c09]">
      {/* Parallax Background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-[-15%] z-0"
      >
        <img
          src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/b7b51063a_generated_image.png"
          alt="Chef's spotlight background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/80" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-5"
        >
          <ChefHat className="w-4 h-4 text-primary" />
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Chef's Spotlight
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">
          {/* Left — Dish Hero + Story */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-3"
            >
              {SPOTLIGHT.dish}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="font-body text-xs uppercase tracking-[0.25em] text-primary/80 font-semibold mb-8"
            >
              {SPOTLIGHT.tagline}
            </motion.p>

            {/* Dish Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-3xl overflow-hidden aspect-[4/3] mb-8 shadow-2xl shadow-black/50"
            >
              <img
                src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/368feb9d6_generated_image.png"
                alt={SPOTLIGHT.dish}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>

            {/* Story */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-body text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold">
                  The Story
                </span>
              </div>
              <p className="font-body text-white/70 text-base leading-relaxed mb-5">
                {SPOTLIGHT.story}
              </p>
              <blockquote className="border-l-2 border-primary pl-5">
                <p className="font-heading text-lg italic text-white/90 leading-relaxed">
                  {SPOTLIGHT.chefNote}
                </p>
                <cite className="font-body text-xs text-primary mt-2 block not-italic uppercase tracking-wider font-semibold">
                  — Chef Laurent Moreau
                </cite>
              </blockquote>
            </motion.div>
          </div>

          {/* Right — Ingredients + Wine */}
          <div className="flex flex-col gap-10">
            {/* Ingredients */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 mb-5"
              >
                <Leaf className="w-4 h-4 text-green-400" />
                <span className="font-body text-xs uppercase tracking-[0.25em] text-green-400 font-semibold">
                  Ingredient Breakdown
                </span>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SPOTLIGHT.ingredients.map((item, i) => (
                  <IngredientCard key={item.name} item={item} index={i} />
                ))}
              </div>
            </div>

            {/* Wine Pairing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <Wine className="w-4 h-4 text-rose-400" />
                <span className="font-body text-xs uppercase tracking-[0.25em] text-rose-400 font-semibold">
                  Sommelier's Wine Pairing
                </span>
              </div>

              <h4 className="font-heading text-2xl font-semibold text-white mb-1">
                {SPOTLIGHT.wine.name}
              </h4>
              <p className="font-body text-xs text-white/50 uppercase tracking-wider mb-4 font-medium">
                {SPOTLIGHT.wine.region}
              </p>

              <div className="space-y-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">Tasting Notes</p>
                  <p className="font-body text-sm text-white/70 leading-relaxed">{SPOTLIGHT.wine.notes}</p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-body text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">Why It Works</p>
                  <p className="font-body text-sm text-white/70 leading-relaxed">{SPOTLIGHT.wine.pairingReason}</p>
                </div>
              </div>

              <a
                href="#reserve"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <Wine className="w-4 h-4" />
                Reserve for Tonight
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}