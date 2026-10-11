import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CalendarDays, Clock, ChevronRight } from "lucide-react";
import EventCardSkeleton from "./EventCardSkeleton";

const CATEGORY_COLORS = {
  "Wine Tasting": "bg-purple-100 text-purple-700",
  "Tasting Menu": "bg-amber-100 text-amber-700",
  "Holiday Dinner": "bg-red-100 text-red-700",
  "Chef's Table": "bg-amber-100 text-amber-700",
  "Cooking Class": "bg-green-100 text-green-700",
  "Special Occasion": "bg-pink-100 text-pink-700",
  "Other": "bg-muted text-muted-foreground",
};

// Compact 3-card preview of upcoming events, linking to the full Events page.
export default function UpcomingEventsStrip() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Event.filter({ is_published: true }, "date", 6)
      .then((data) => {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
        const upcoming = (Array.isArray(data) ? data : data.items || []).filter((e) => e.date >= today).slice(0, 3);
        setEvents(upcoming);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <section className="py-16 md:py-20 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-2">What's On</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Upcoming Events</h2>
          </div>
          <Link to="/events" className="hidden sm:flex items-center gap-1 font-body text-sm text-primary hover:text-primary/80 transition-colors">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [0, 1, 2].map((i) => <EventCardSkeleton key={i} index={i} />)
            : events.map((event, i) => {
                const dateObj = new Date(event.date + "T00:00:00");
                const month = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();
                const day = dateObj.getDate();
                const soldOut = event.spots_available <= 0;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                  >
                    <Link to="/events" className="group block bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative h-44 overflow-hidden bg-muted">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                            <CalendarDays className="w-12 h-12 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-white rounded-xl shadow-md px-3 py-1.5 text-center min-w-[48px]">
                          <p className="font-body text-[10px] font-semibold text-muted-foreground">{month}</p>
                          <p className="font-heading text-lg font-bold text-foreground leading-none">{day}</p>
                        </div>
                        {event.event_type && (
                          <span className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[event.event_type] || CATEGORY_COLORS["Other"]}`}>
                            {event.event_type}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-heading text-lg font-semibold mb-1.5 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-body text-xs">{event.time}</span>
                          </div>
                          <span className="font-body text-xs font-semibold text-primary">${Number(event.price_per_guest).toFixed(0)}/guest</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`font-body text-xs font-medium ${soldOut ? "text-muted-foreground" : "text-foreground/70"}`}>
                            {soldOut ? "Sold out" : `${event.spots_available} spots left`}
                          </span>
                          <span className="flex items-center gap-1 font-body text-xs text-primary font-semibold">
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link to="/events" className="inline-flex items-center gap-1 font-body text-sm text-primary hover:text-primary/80 transition-colors">
            View all events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}