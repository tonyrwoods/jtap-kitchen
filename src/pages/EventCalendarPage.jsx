import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Ticket, Users, ChevronRight, PartyPopper } from "lucide-react";
import FullEventCalendar, { categoryFor } from "../components/events/FullEventCalendar";

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function EventDetailCard({ item }) {
  const cat = categoryFor(item);
  const soldOut = item.kind === "event" && item.soldOut;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cat.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
            {cat.label}
          </span>
          {item.kind === "promo" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <PartyPopper className="w-3 h-3" /> Private event
            </span>
          )}
        </div>
        <h4 className="font-heading text-lg font-semibold mb-2">{item.title}</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {item.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(item.time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ""}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </span>
          )}
          {item.kind === "event" && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> {soldOut ? "Sold out" : `${item.spots ?? 0} spot${item.spots !== 1 ? "s" : ""} left`}
            </span>
          )}
          {Number(item.price) > 0 && (
            <span className="inline-flex items-center gap-1 text-primary font-semibold">
              <Ticket className="w-3 h-3" /> ${Number(item.price).toFixed(0)} / guest
            </span>
          )}
        </div>
        {item.description && <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
      </div>
      <div className="shrink-0">
        {item.url ? (
          <a
            href={item.url}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-body text-sm font-semibold transition-all ${
              soldOut ? "bg-muted text-muted-foreground pointer-events-none" : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {soldOut ? "Sold Out" : item.kind === "promo" ? "View & RSVP" : "Reserve"} {!soldOut && <ChevronRight className="w-4 h-4" />}
          </a>
        ) : (
          <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-muted text-muted-foreground font-body text-sm font-semibold">Invite only</span>
        )}
      </div>
    </motion.div>
  );
}

export default function EventCalendarPage() {
  useSeoMeta("events");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    document.title = "Event Calendar — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Browse upcoming tasting menus, wine evenings, and private events at JTAP Kitchen in Memphis.");
  }, []);

  useEffect(() => {
    Promise.all([
      base44.entities.Event.filter({ is_published: true }, "date", 100),
      base44.entities.EventPromotion.filter({ is_active: true }, "date", 100),
    ])
      .then(([events, promos]) => {
        const today = new Date().toISOString().split("T")[0];
        const merged = [
          ...events
            .filter((e) => e.date && e.date >= today)
            .map((e) => ({
              id: `e-${e.id}`,
              kind: "event",
              title: e.title,
              date: e.date,
              time: e.time,
              end_time: null,
              type: e.event_type,
              location: "JTAP Kitchen — Memphis, TN",
              price: e.price_per_guest,
              spots: e.spots_available,
              soldOut: (e.spots_available ?? 0) <= 0,
              description: e.description,
              url: "/events",
            })),
          ...promos
            .filter((p) => p.date && p.date >= today)
            .map((p) => ({
              id: `p-${p.id}`,
              kind: "promo",
              title: p.title,
              date: p.date,
              time: p.time,
              end_time: p.end_time,
              type: p.event_type,
              location: p.location_label || "JTAP Kitchen — Memphis, TN",
              price: p.price_per_guest,
              spots: null,
              soldOut: false,
              description: p.subtitle || p.description,
              url: p.share_slug ? `/event-announce/${p.share_slug}` : null,
            })),
        ];
        setItems(merged);
      })
      .finally(() => setLoading(false));
  }, []);

  // Categories present (for legend)
  const legend = [];
  const seen = new Set();
  items.forEach((item) => {
    const cat = categoryFor(item);
    if (!seen.has(cat.label)) {
      seen.add(cat.label);
      legend.push(cat);
    }
  });

  const selectedStr = selectedDate ? new Date(selectedDate).toISOString().split("T")[0] : null;
  const dayItems = selectedStr
    ? items.filter((i) => i.date === selectedStr).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"))
    : [];

  const selectedLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero */}
      <div className="bg-foreground text-background py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">What's Happening</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-4">Event Calendar</h1>
          <p className="font-body text-background/60 text-base md:text-lg max-w-xl mx-auto">
            Browse every upcoming tasting menu, wine evening, and private event in one place.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-6">
        {/* Legend */}
        {legend.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {legend.map((cat) => (
              <span key={cat.label} className="inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} /> {cat.label}
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <FullEventCalendar items={items} selectedDate={selectedDate} onDaySelect={setSelectedDate} />

            {/* Selected day details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-lg font-semibold">{selectedLabel}</h3>
                <span className="font-body text-xs text-muted-foreground">· {dayItems.length} event{dayItems.length !== 1 ? "s" : ""}</span>
              </div>
              {dayItems.length === 0 ? (
                <div className="text-center py-10 bg-card border border-dashed border-border rounded-2xl">
                  <p className="font-body text-sm text-muted-foreground">No events on this date. Pick another day or browse future months.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <EventDetailCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}