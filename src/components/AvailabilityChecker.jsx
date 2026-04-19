import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarCheck, Users, Clock } from "lucide-react";

const TIME_SLOTS = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"
];

const MAX_TABLES = 10; // max concurrent bookings per slot

export default function AvailabilityChecker({ onBook }) {
  const [partySize, setPartySize] = useState(2);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    base44.entities.Reservation.filter({ date: today })
      .then((res) => {
        setReservations(res.filter(r => r.status !== "Cancelled"));
        setLoading(false);
      });
  }, [today]);

  const bookedCountBySlot = (slot) =>
    reservations.filter(r => r.time === slot).length;

  const isAvailable = (slot) => bookedCountBySlot(slot) < MAX_TABLES;

  const availableSlots = TIME_SLOTS.filter(isAvailable);

  return (
    <section id="reserve" className="bg-card border-y border-border py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-body font-medium mb-3">
            <CalendarCheck className="w-4 h-4" />
            Tonight's Availability
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Book Your Table for Tonight
          </h2>
          <p className="font-body text-muted-foreground mt-2">
            Check open slots and reserve in seconds.
          </p>
        </div>

        {/* Party Size Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="font-body text-sm text-muted-foreground flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Party size:
          </span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <button
                key={n}
                onClick={() => setPartySize(n)}
                className={`w-9 h-9 rounded-full text-sm font-body font-medium transition-all ${
                  partySize === n
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {TIME_SLOTS.map(slot => {
              const available = isAvailable(slot);
              return (
                <button
                  key={slot}
                  disabled={!available}
                  onClick={() => available && onBook && onBook({ time: slot, party_size: partySize, date: today })}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-sm font-body font-medium transition-all ${
                    available
                      ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
                      : "border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {slot}
                  <span className={`text-xs font-normal ${available ? "text-green-600" : "text-muted-foreground"}`}>
                    {available ? "Available" : "Full"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!loading && availableSlots.length === 0 && (
          <p className="text-center font-body text-muted-foreground mt-4">
            No open tables tonight — <a href="/reservations-calendar" className="text-primary underline">try another date</a>.
          </p>
        )}

        {!loading && availableSlots.length > 0 && (
          <p className="text-center font-body text-sm text-muted-foreground mt-5">
            {availableSlots.length} time slot{availableSlots.length !== 1 ? "s" : ""} available tonight — click any to book.
          </p>
        )}
      </div>
    </section>
  );
}