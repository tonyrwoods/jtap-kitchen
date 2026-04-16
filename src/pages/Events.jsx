import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Users, Ticket, ChevronRight, X, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_COLORS = {
  "Wine Tasting": "bg-purple-100 text-purple-700",
  "Chef's Table": "bg-amber-100 text-amber-700",
  "Cooking Class": "bg-green-100 text-green-700",
  "Seasonal Menu": "bg-orange-100 text-orange-700",
  "Live Music Dinner": "bg-blue-100 text-blue-700",
  "Other": "bg-muted text-muted-foreground",
};

function BookingModal({ event, onClose }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ guest_name: "", email: "", phone: "", party_size: 1, special_requests: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const spotsLeft = (event.capacity || 0) - (event.spots_booked || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.party_size > spotsLeft) {
      toast({ title: "Not enough spots", description: `Only ${spotsLeft} spot(s) remaining.`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await base44.entities.Reservation.create({
      guest_name: form.guest_name,
      email: form.email,
      phone: form.phone,
      date: event.date,
      time: event.time,
      party_size: form.party_size,
      special_requests: `[Event: ${event.title}] ${form.special_requests}`,
      status: "Pending",
    });
    await base44.entities.Event.update(event.id, {
      spots_booked: (event.spots_booked || 0) + form.party_size,
    });
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-heading text-xl font-bold">Book Your Spot</h3>
            <p className="font-body text-sm text-muted-foreground mt-1">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-heading text-lg font-semibold mb-2">You're on the list!</h4>
            <p className="font-body text-sm text-muted-foreground">We'll confirm your booking via email shortly.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="font-body text-xs text-muted-foreground mb-1 block">Full Name *</label>
                <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background font-body" required value={form.guest_name} onChange={e => set("guest_name", e.target.value)} />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Email *</label>
                <input type="email" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background font-body" required value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Phone</label>
                <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background font-body" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Guests *</label>
                <select className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background font-body" value={form.party_size} onChange={e => set("party_size", parseInt(e.target.value))}>
                  {Array.from({ length: Math.min(spotsLeft, 10) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Total</label>
                <div className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-muted font-heading font-semibold text-primary">
                  ${(form.party_size * (event.price_per_person || 0)).toFixed(2)}
                </div>
              </div>
              <div className="col-span-2">
                <label className="font-body text-xs text-muted-foreground mb-1 block">Special Requests</label>
                <textarea className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background font-body resize-none" rows={2} value={form.special_requests} onChange={e => set("special_requests", e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function EventCard({ event, onBook, index }) {
  const spotsLeft = (event.capacity || 0) - (event.spots_booked || 0);
  const soldOut = spotsLeft <= 0;
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
        {/* Date badge */}
        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md px-3 py-2 text-center min-w-[50px]">
          <p className="font-body text-xs font-semibold text-muted-foreground">{month}</p>
          <p className="font-heading text-xl font-bold text-foreground leading-none">{day}</p>
        </div>
        {event.category && (
          <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS["Other"]}`}>
            {event.category}
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
            <span className="font-body text-xs">{event.time}{event.end_time ? ` – ${event.end_time}` : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-body text-xs">{soldOut ? "Sold out" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Ticket className="w-3.5 h-3.5" />
            <span className="font-body text-xs font-semibold">${Number(event.price_per_person).toFixed(2)} / person</span>
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

  const CATEGORIES = ["All", "Wine Tasting", "Chef's Table", "Cooking Class", "Seasonal Menu", "Live Music Dinner", "Other"];

  useEffect(() => {
    base44.entities.Event.filter({ is_published: true }, "date", 50).then(data => {
      const today = new Date().toISOString().split("T")[0];
      setEvents(data.filter(e => e.date >= today));
      setLoading(false);
    });
  }, []);

  const filtered = filter === "All" ? events : events.filter(e => e.category === filter);

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
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(cat => (
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No upcoming events</h3>
            <p className="font-body text-muted-foreground">Check back soon — we're always planning something special.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} onBook={setBookingEvent} index={i} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {bookingEvent && <BookingModal event={bookingEvent} onClose={() => setBookingEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}