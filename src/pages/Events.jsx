import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Users, Ticket, ChevronRight, Search, X } from "lucide-react";
import EventCalendar from "../components/EventCalendar";
import EventBookingModal from "../components/EventBookingModal";
import EventCardSkeleton from "../components/EventCardSkeleton";
import EventCountdown from "../components/EventCountdown";
import WaitlistConfirmationModal from "../components/WaitlistConfirmationModal";
import PromoBanner from "../components/events/PromoBanner";

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
      className={`group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div className="relative h-52 overflow-hidden bg-muted">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-body text-xs">{event.time} ({event.duration_minutes}m)</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-body text-xs" aria-live="polite">{soldOut ? "Sold out" : `${event.spots_available} spot${event.spots_available !== 1 ? "s" : ""} left`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-body text-xs font-semibold">${Number(event.price_per_guest).toFixed(2)} / guest</span>
          </div>
        </div>
        <div className="mb-4">
          <EventCountdown date={event.date} />
        </div>

        <button
          onClick={() => !soldOut && onBook(event)}
          disabled={soldOut}
          aria-label={`${soldOut ? "Sold out for" : "Book a spot for"} ${event.title} on ${new Date(event.date).toLocaleDateString()}`}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-body text-sm font-semibold transition-all duration-200 ${
            soldOut
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {soldOut ? "Sold Out" : "Book a Spot"} {!soldOut && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </motion.div>
  );
}

export default function Events() {
  useSeoMeta("events");
  useEffect(() => {
    document.title = "Upcoming Events at JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Upcoming events at JTAP Kitchen — wine tastings, chef's table dinners, and seasonal tasting menus in Memphis.");
  }, []);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingEvent, setBookingEvent] = useState(null);
  const [waitlistEvent, setWaitlistEvent] = useState(null);
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
  const searchFiltered = dateFiltered.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

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
        <PromoBanner />
        {/* Calendar + Filter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <EventCalendar events={events} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
          </div>

          {/* Events List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search + Filter */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search events by title or description"
                  className="w-full pl-11 pr-4 py-3 border border-border rounded-full bg-background placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {EVENT_TYPES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    aria-pressed={filter === cat}
                    className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {[...Array(4)].map((_, i) => (
                  <EventCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : searchFiltered.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  {search ? "No events match your search" : "No events on this date"}
                </h3>
                <p className="font-body text-muted-foreground">
                  {search ? "Try adjusting your search terms." : "Try selecting another date or filtering by category."}
                </p>
                {(search || selectedDate) && (
                  <button
                    onClick={() => { setSearch(""); setSelectedDate(null); }}
                    className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-all"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {searchFiltered.map((event, i) => (
                  <EventCard key={event.id} event={event} onBook={setBookingEvent} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {bookingEvent && (
          <EventBookingModal 
            event={bookingEvent} 
            onClose={() => setBookingEvent(null)} 
            onWaitlist={(event) => {
              setBookingEvent(null);
              setWaitlistEvent(event);
            }}
            onBookingComplete={() => setBookingEvent(null)} 
          />
        )}
        {waitlistEvent && <WaitlistConfirmationModal event={waitlistEvent} onClose={() => setWaitlistEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}