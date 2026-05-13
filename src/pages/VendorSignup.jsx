import EventServiceProviderSignup from "../components/EventServiceProviderSignup";
import { ArrowLeft, CalendarDays, Users, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const PERKS = [
  { icon: CalendarDays, title: "Regular Bookings", desc: "Access to private events every Sunday, Monday & Tuesday year-round." },
  { icon: Users, title: "Curated Clientele", desc: "Perform for vetted guests at upscale corporate, wedding, and social events." },
  { icon: Star, title: "Premium Exposure", desc: "Get featured in our event catalog and recommended to clients directly." },
  { icon: TrendingUp, title: "Grow Your Brand", desc: "Build relationships with repeat clients and earn referrals through our network." },
];

export default function VendorSignup() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-4">
        <Link to="/event-center" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Event Center
        </Link>
      </div>

      {/* Why Partner section */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <p className="font-body text-xs uppercase tracking-widest text-primary font-semibold mb-2">Partner With Us</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Why Join the JTAP Network?</h1>
          <p className="font-body text-muted-foreground max-w-xl mx-auto text-sm">
            JTAP Kitchen's Event Center is launching June/July 2026 — we're building a curated roster of talented professionals to serve our private events. Get in early.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-body text-sm font-semibold text-foreground mb-1">{title}</h3>
                <p className="font-body text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EventServiceProviderSignup />
    </div>
  );
}