import { Link } from "react-router-dom";
import { Percent, Clock, Heart, Sparkles } from "lucide-react";

const BENEFITS = [
  { icon: Percent, title: "Lower Prices", desc: "No third-party markups or delivery-app fees added to your order." },
  { icon: Clock, title: "Faster Pickup", desc: "Your order goes straight to our kitchen, with no middleman delays." },
  { icon: Sparkles, title: "Earn Rewards", desc: "Every direct order earns Tap Room Society loyalty points." },
  { icon: Heart, title: "Support Local", desc: "Your money stays with a Memphis family-run restaurant." },
];

export default function OrderDirectBenefits() {
  return (
    <section className="px-6 py-16 bg-background">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
          Order Online Directly From JTAP Kitchen
        </h2>
        <p className="font-body text-foreground/80 max-w-xl mx-auto mb-10">
          Skip the middleman. Ordering takeout or brunch directly from us means better prices, faster service, and rewards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-card border border-border rounded-2xl p-6">
              <b.icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <h3 className="font-heading text-base font-bold text-foreground mb-2">{b.title}</h3>
              <p className="font-body text-sm text-foreground/80 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <Link
          to="/menu"
          className="inline-block px-10 py-4 bg-primary text-primary-foreground font-body text-sm font-bold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity"
        >
          Order Now
        </Link>
      </div>
    </section>
  );
}