import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Navigation } from "lucide-react";

// Compact logistics strip near the bottom of the homepage.
// Gives ready-to-book visitors the essential info (where, when, how to call)
// without making them scroll to the footer or visit a separate Contact page.
const HOURS = [
  { day: "Brunch", time: "Sat & Sun · 10:00 AM – 2:00 PM" },
  { day: "Lunch", time: "Mon – Fri · 10:00 AM – 3:00 PM" },
  { day: "Dinner", time: "Sun, Mon, Thu – Sat · 5:00 PM – 10:00 PM" },
  { day: "Event Center", time: "Tue & Wed · Reservation Only" },
];

export default function PlanYourVisit() {
  return (
    <section className="py-20 md:py-28 px-6 bg-muted/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Find Us
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-3">
            Plan Your Visit
          </h2>
          <p className="font-body text-muted-foreground text-base max-w-lg mx-auto">
            We're on Summer Ave in the heart of Memphis — come hungry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location & Contact */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Location</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  3397 Summer Ave.<br />Memphis, TN 38122
                </p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=3397+Summer+Ave+Memphis+TN+38122"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 font-body text-sm text-primary hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Reservations</h3>
                <a href="tel:9012138085" className="font-body text-sm text-muted-foreground hover:text-primary">
                  (901) 213-8085
                </a>
              </div>
            </div>
          </motion.div>

          {/* Hours */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Hours</h3>
            </div>
            <div className="space-y-3">
              {HOURS.map((h) => (
                <div key={h.day} className="flex justify-between items-baseline gap-4 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <span className="font-body text-sm font-medium text-foreground">{h.day}</span>
                  <span className="font-body text-sm text-muted-foreground text-right">{h.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}