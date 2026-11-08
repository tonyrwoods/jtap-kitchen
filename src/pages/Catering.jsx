import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Cake, PartyPopper, UtensilsCrossed, Phone, ShoppingBag } from "lucide-react";
import useSeoMeta from "@/hooks/useSeoMeta";
import { CATERING_ORDER_URL } from "@/lib/ordering";

// Catering landing page. Every order CTA hands guests off to the app's online
// ordering experience (/menu) where they build a cart and check out.

const OCCASIONS = [
  {
    icon: Building2,
    title: "Corporate & Office",
    copy: "Working lunches, client meetings, and team celebrations delivered ready to serve.",
  },
  {
    icon: Cake,
    title: "Celebrations",
    copy: "Birthdays, showers, and graduations with the dishes guests ask for by name.",
  },
  {
    icon: PartyPopper,
    title: "Holidays & Parties",
    copy: "Holiday spreads and game-day trays built to feed a crowd without the cooking.",
  },
  {
    icon: UtensilsCrossed,
    title: "Private Events",
    copy: "Full-service events for larger groups in our Event Center, Tuesday and Wednesday.",
  },
];

const STEPS = [
  { step: "01", title: "Browse the menu", copy: "Chef-curated casual dishes, sides, and desserts — all available to order in bulk." },
  { step: "02", title: "Build your order online", copy: "Add what you need on our online ordering page — delivery or pickup, $50 minimum." },
  { step: "03", title: "We handle the rest", copy: "Order a day ahead and your food arrives packed, labeled, and ready to serve." },
];

export default function Catering() {
  useSeoMeta("catering");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/92f5560cf_jtap-catering-hero.png"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 lg:px-10 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="font-body text-xs uppercase tracking-[0.3em] font-semibold text-primary">
              Catering
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-background mt-4 mb-5 leading-tight">
              JTAP Kitchen,<br className="sm:hidden" /> brought to your table
            </h1>
            <p className="font-body text-base md:text-lg text-background/70 max-w-xl mx-auto mb-9 leading-relaxed">
              Chef-prepared trays and platters for the office, the party, and everything in between.
              Order online for delivery or pickup from our kitchen on Summer Ave.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={CATERING_ORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="w-4 h-4" /> Order Catering Online
              </a>
              <Link
                to="/event-center"
                className="inline-flex items-center gap-2 px-8 py-4 border border-background/30 text-background rounded-full font-body text-sm font-semibold tracking-wide hover:bg-background/10 transition-colors"
              >
                Plan a Large Event <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <Link
              to="/catering-flyer"
              className="inline-block mt-6 font-body text-sm text-background/60 hover:text-primary underline underline-offset-4 transition-colors"
            >
              Download our office catering flyer
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Occasions */}
      <section className="py-20 md:py-24 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              We cater for
            </h2>
            <p className="font-body text-muted-foreground max-w-lg mx-auto">
              From a dozen boxed lunches to a full holiday spread — same kitchen, same standards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {OCCASIONS.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24 px-6 lg:px-10 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              How catering works
            </h2>
            <p className="font-body text-muted-foreground">Three steps, no phone tag.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ step, title, copy }) => (
              <div key={step} className="bg-card border border-border rounded-2xl p-7">
                <span className="font-heading text-3xl font-bold text-primary/40">{step}</span>
                <h3 className="font-heading text-lg font-semibold text-foreground mt-3 mb-2">{title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto bg-foreground rounded-3xl px-8 py-14 md:px-16 md:py-16 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-background mb-4">
            Ready to order catering?
          </h2>
          <p className="font-body text-sm md:text-base text-background/60 max-w-lg mx-auto mb-8 leading-relaxed">
            Build your order online in minutes. Planning something bigger than 30 guests? Our Event Center
            team will handle the room, the menu, and the service.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={CATERING_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" /> Order Catering Online
            </a>
            <a
              href="tel:+19012138085"
              className="inline-flex items-center gap-2 px-8 py-4 border border-background/30 text-background rounded-full font-body text-sm font-semibold tracking-wide hover:bg-background/10 transition-colors"
            >
              <Phone className="w-4 h-4" /> (901) 213-8085
            </a>
          </div>
          <p className="font-body text-xs text-background/40 mt-6">
            Delivery or pickup · $50 order minimum · Please order at least one day ahead · 3397 Summer Ave., Memphis, TN 38122
          </p>
        </div>
      </section>
    </div>
  );
}