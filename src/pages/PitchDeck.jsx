import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

const slides = [
  {
    tag: "Slide 01",
    title: "Where Every Bite Tells a Story",
    subtitle: "JTAP Kitchen",
    body: "High-end casual dining reimagined in Memphis, TN. Bold flavors, real hospitality, and a warm atmosphere where culinary artistry meets genuine connection.",
    bg: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/dbe7ca72f_generated_6964c032.png",
    isHero: true,
  },
  {
    tag: "Slide 02",
    title: "The Concept",
    subtitle: "High-End Casual, Done Right",
    body: "JTAP Kitchen bridges the gap between fine dining and approachability. We deliver chef-driven, seasonal farm-to-table cuisine in a warm, welcoming environment — no pretense, no stuffiness, just exceptional food and genuine hospitality.",
    points: [
      "Seasonal, locally-sourced menus",
      "Chef's table experiences",
      "Curated wine & cocktail program",
      "Sunday brunch + dinner service",
    ],
    bg: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
  },
  {
    tag: "Slide 03",
    title: "The Market",
    subtitle: "Memphis Dining Scene",
    body: "Memphis is a growing culinary destination with an underserved market for elevated-yet-accessible dining. The city's food culture is rich, but there's a clear gap between casual spots and white-tablecloth restaurants — JTAP Kitchen fills it.",
    stats: [
      { value: "1.3M+", label: "Memphis Metro Population" },
      { value: "$2.1B", label: "Memphis Restaurant Market" },
      { value: "5.5%", label: "Annual Dining Growth" },
      { value: "0", label: "Direct Competitors at Our Price Tier" },
    ],
    bg: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80",
  },
  {
    tag: "Slide 04",
    title: "Location & Hours",
    subtitle: "3397 Summer Ave., Memphis TN",
    body: "Strategically located on Summer Avenue in the heart of Memphis, JTAP Kitchen is positioned to capture both local residents and visitors seeking a premium dining destination.",
    points: [
      "Wed–Thu: 5:30 PM – 10:00 PM",
      "Fri–Sat: 5:30 PM – 11:00 PM",
      "Sunday Brunch: 10:00 AM – 3:00 PM",
      "Sunday Dinner: 5:00 PM – 10:00 PM",
    ],
    bg: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1600&q=80",
  },
  {
    tag: "Slide 05",
    title: "Revenue Streams",
    subtitle: "Diversified Income Model",
    body: "JTAP Kitchen isn't just a restaurant — it's a multi-channel hospitality brand with diverse revenue streams built for resilience and growth.",
    stats: [
      { value: "Dine-In", label: "Primary restaurant revenue" },
      { value: "Events", label: "Private room & full buyout rentals" },
      { value: "Loyalty", label: "JTAP Room Society membership program" },
      { value: "Gift Cards", label: "Digital gift card program" },
    ],
    bg: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1600&q=80",
  },
  {
    tag: "Slide 06",
    title: "Technology-Forward",
    subtitle: "A Fully Integrated Platform",
    body: "Our custom-built app powers every guest touchpoint — from reservations and ordering to loyalty and events — giving us a competitive edge and deep customer insights.",
    points: [
      "AI-powered dining assistant & reservation chat",
      "Real-time waitlist & table-ready notifications",
      "Digital loyalty program with tiered rewards",
      "Inventory, staff scheduling, and kitchen display systems",
      "Vendor management & financial reconciliation tools",
    ],
    bg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
  },
  {
    tag: "Slide 07",
    title: "The Team",
    subtitle: "Built by Hospitality Veterans",
    body: "Our team brings together culinary expertise, hospitality leadership, and technical innovation to create a dining experience that's as seamless behind the scenes as it is at the table.",
    stats: [
      { value: "Chef", label: "Seasonal menu development" },
      { value: "FOH", label: "Front-of-house hospitality" },
      { value: "BOH", label: "Kitchen operations" },
      { value: "Tech", label: "Platform & growth engineering" },
    ],
    bg: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80",
  },
  {
    tag: "Slide 08",
    title: "Opening & Timeline",
    subtitle: "July 2026 Launch",
    body: "JTAP Kitchen is opening its doors in July 2026. Reservations are now live — be among the first to experience dining redefined in Memphis.",
    stats: [
      { value: "Jul 2026", label: "Grand Opening" },
      { value: "Now", label: "Reservations Open" },
      { value: "Q3 2026", label: "Loyalty Program Launch" },
      { value: "Q4 2026", label: "Event Center Activation" },
    ],
    bg: "https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=1600&q=80",
  },
  {
    tag: "Slide 09",
    title: "Join the Story",
    subtitle: "Let's Build Together",
    body: "JTAP Kitchen is more than a restaurant — it's a movement to redefine what dining can be. We're looking for partners, investors, and believers who want to be part of something special.",
    isCTA: true,
    bg: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80",
  },
];

function Slide({ slide, index }) {
  if (slide.isHero) {
    return (
      <div className="relative w-full h-full flex items-center justify-center text-center px-6">
        <div className="absolute inset-0">
          <img src={slide.bg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <p className="font-body text-xs uppercase tracking-[0.35em] text-primary mb-6">{slide.tag}</p>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
            {slide.title}
          </h1>
          <p className="font-body text-base md:text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
            {slide.body}
          </p>
          <p className="font-heading text-2xl md:text-3xl italic text-primary/90">{slide.subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={slide.bg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/40" />
      </div>
      <div className="relative z-10 max-w-2xl px-8 md:px-16 py-12">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{slide.tag}</p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight mb-3">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="font-heading text-lg md:text-2xl italic text-primary/80 mb-6">{slide.subtitle}</p>
        )}
        <p className="font-body text-sm md:text-base text-white/70 leading-relaxed mb-8 max-w-lg">
          {slide.body}
        </p>

        {slide.points && (
          <ul className="space-y-3">
            {slide.points.map((pt, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="font-body text-sm text-white/85">{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {slide.stats && (
          <div className="grid grid-cols-2 gap-5 mt-2">
            {slide.stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                <p className="font-heading text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                <p className="font-body text-xs text-white/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {slide.isCTA && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a href="mailto:info@jtapkitchen.com"
              className="px-8 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/25 text-center">
              Get in Touch
            </a>
            <a href="/"
              className="px-8 py-4 border-2 border-white/30 text-white font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all text-center">
              Visit Website
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PitchDeck() {
  const [index, setIndex] = useState(0);
  const haptic = useHaptic();

  useEffect(() => {
    document.title = "JTAP Kitchen — Pitch Deck";
  }, []);

  const go = (dir) => {
    haptic?.();
    setIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slide = slides[index];

  return (
    <div className="fixed inset-0 bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full"
        >
          <Slide slide={slide} index={index} />
        </motion.div>
      </AnimatePresence>

      {/* Nav arrows */}
      <button
        onClick={() => go(-1)}
        disabled={index === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-0 disabled:cursor-default transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
          <span className="font-heading text-lg font-semibold">JTAP Kitchen</span>
        </a>
        <span className="font-body text-xs text-white/50 uppercase tracking-[0.2em]">
          {index + 1} / {slides.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { haptic?.(); setIndex(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}