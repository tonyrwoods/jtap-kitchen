import { Zap, TrendingUp, Clock, ShieldCheck, BarChart2, Layers } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning-Fast Operations",
    desc: "Streamline front-of-house and back-of-house workflows so your team spends less time on logistics and more time delivering exceptional experiences.",
  },
  {
    icon: TrendingUp,
    title: "Data-Driven Growth",
    desc: "Track covers, peak hours, and menu performance in real time. Make confident decisions backed by live insights — not guesswork.",
  },
  {
    icon: Clock,
    title: "Save Hours Every Week",
    desc: "Automate reservations, inventory alerts, and staff scheduling. Reclaim time that goes straight back into your kitchen and your guests.",
  },
  {
    icon: ShieldCheck,
    title: "Reduce Costly Errors",
    desc: "Centralised order and reservation management means fewer mistakes, fewer no-shows, and tighter control over every service.",
  },
  {
    icon: BarChart2,
    title: "Smarter Menu Engineering",
    desc: "Identify your highest-margin dishes, test seasonal specials, and optimise pricing — all from one intuitive dashboard.",
  },
  {
    icon: Layers,
    title: "Scale Without the Chaos",
    desc: "Whether you're running one location or five, our platform grows with you — keeping quality consistent and teams aligned.",
  },
];

const STATS = [
  { value: "3×", label: "Faster table turnover" },
  { value: "40%", label: "Reduction in no-shows" },
  { value: "28%", label: "Average revenue uplift" },
  { value: "15 hrs", label: "Saved per week, per venue" },
];

export default function SmartKitchenSection() {
  return (
    <section className="py-24 md:py-32 bg-foreground text-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Built for Food Businesses
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-background mt-4 mb-6 leading-tight">
            Operate Smarter.<br />Grow Faster.
          </h2>
          <p className="font-body text-background/60 text-lg max-w-2xl mx-auto leading-relaxed">
            In a competitive market, the difference between a thriving restaurant and a struggling one often comes down to systems. We give food businesses the edge they need — from the first booking to the final bill.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-background/10 rounded-2xl overflow-hidden mb-20">
          {STATS.map((s) => (
            <div key={s.label} className="bg-background/5 px-8 py-8 text-center">
              <p className="font-heading text-4xl font-bold text-primary mb-1">{s.value}</p>
              <p className="font-body text-sm text-background/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group bg-background/5 border border-background/10 hover:border-primary/40 rounded-2xl p-7 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-background mb-2">{f.title}</h3>
                <p className="font-body text-sm text-background/55 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="font-body text-background/50 text-sm mb-6">
            Join hundreds of food businesses already running smarter operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#reserve"
              className="px-8 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Book a Table
            </a>
            <a
              href="#menu"
              className="px-8 py-4 border border-background/20 text-background font-body text-sm font-medium rounded-full hover:bg-background/10 transition-colors"
            >
              Explore Our Menu
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}