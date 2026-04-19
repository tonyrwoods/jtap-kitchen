import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Users, Ticket, ChevronRight } from "lucide-react";
import EventCalendar from "../components/EventCalendar";
import EventBookingModal from "../components/EventBookingModal";

const CATEGORY_COLORS = {
  "Wine Tasting": "bg-purple-100 text-purple-700",
  "Tasting Menu": "bg-amber-100 text-amber-700",
  "Holiday Dinner": "bg-red-100 text-red-700",
  "Chef's Table": "bg-amber-100 text-amber-700",
  "Cooking Class": "bg-green-100 text-green-700",
  "Special Occasion": "bg-pink-100 text-pink-700",
  "Other": "bg-muted text-muted-foreground",
};

function EventCard({ event, onBook, index }) {
  const soldOut = event.spots_available <= 0;
  const dateObj = new Date(event.date + "T00:00:00");
  const month = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();
  const day = dateObj.getDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative h-52 overflow-hidden bg-muted">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
            <CalendarDays className="w-14 h-14 text-primary/40" />
          </div>
        )}
        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md px-3 py-2 text-center min-w-[50px]">
          <p className="font-body text-xs font-semibold text-muted-foreground">{month}</p>
          <p className="font-heading text-xl font-bold text-foreground leading-none">{day}</p>
        </div>
        {event.event_type && (
          <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[event.event_type] || CATEGORY_COLORS["Other"]}`}>
            {event.event_type}
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-foreground font-heading font-bold text-sm px-5 py-2 rounded-full uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
        {event.description && <p className="font-body text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>}

        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-body text-xs">{event.time} ({event.duration_minutes}m)</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-body text-xs">{soldOut ? "Sold out" : `${event.spots_available} spot${event.spots_available !== 1 ? "s" : ""} left`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Ticket className="w-3.5 h-3.5" />
            <span className="font-body text-xs font-semibold">${Number(event.price_per_guest).toFixed(2)} / guest</span>
          </div>
        </div>

        <button
          onClick={() => !soldOut && onBook(event)}
          disabled={soldOut}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-body text-sm font-semibold transition-all duration-200 ${
            soldOut
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {soldOut ? "Sold Out" : "Book a Spot"} {!soldOut && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

export default function Events() {
  useSeoMeta("events");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [bookingEvent, setBookingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const EVENT_TYPES = ["All", "Wine Tasting", "Tasting Menu", "Holiday Dinner", "Chef's Table", "Cooking Class", "Special Occasion", "Other"];

  useEffect(() => {
    base44.entities.Event.filter({ is_published: true }, "date", 100).then(data => {
      const today = new Date().toISOString().split("T")[0];
      setEvents(data.filter(e => e.date >= today));
      setLoading(false);
    });
  }, []);

  const filtered = filter === "All" ? events : events.filter(e => e.event_type === filter);
  const dateFiltered = selectedDate 
    ? filtered.filter(e => e.date === selectedDate.toISOString().split("T")[0])
    : filtered;

  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Hero */}
      <div className="bg-foreground text-background py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">Special Experiences</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold mt-4 mb-5">Upcoming Events</h1>
          <p className="font-body text-background/60 text-lg max-w-xl mx-auto">
            Exclusive dining experiences, wine evenings, and cooking masterclasses — reserve your place before they're gone.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        {/* Calendar + Filter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <EventCalendar events={events} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
          </div>

          {/* Events List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 ${
                    filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : dateFiltered.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">No events on this date</h3>
                <p className="font-body text-muted-foreground">Try selecting another date or filtering by category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {dateFiltered.map((event, i) => (
                  <EventCard key={event.id} event={event} onBook={setBookingEvent} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {bookingEvent && <EventBookingModal event={bookingEvent} onClose={() => setBookingEvent(null)} onBookingComplete={() => setBookingEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}