import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Users, Calendar, ChevronRight } from "lucide-react";

// Promotes the Event Center for private bookings — the highest-ticket offering.
// Placed mid-page to catch visitors browsing the menu/about sections.
export default function EventCenterTeaser() {
  const features = [
    { icon: Users, label: "Up to 80 guests" },
    { icon: Calendar, label: "Tue & Wed exclusives" },
    { icon: Sparkles, label: "Custom packages" },
  ];

  return (
    <section className="px-6 py-16 md:py-20 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
        >
          {/* Text */}
          <div className="order-2 md:order-1">
            <p className="font-body text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">Event Center</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Host Your Celebration at JTAP
            </h2>
            <p className="font-body text-sm md:text-base text-muted-foreground mb-6 leading-relaxed max-w-md">
              From intimate gatherings to full buyouts, our Event Center delivers unforgettable dining experiences with custom menus, curated talent, and dedicated service.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-body text-sm text-foreground font-medium">{label}</span>
                </div>
              ))}
            </div>
            <Link
              to="/event-center"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Explore Packages <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&auto=format&fit=crop"
                alt="Elegant private event setup at JTAP Kitchen"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}