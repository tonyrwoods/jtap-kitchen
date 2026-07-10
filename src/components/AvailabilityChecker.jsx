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
            Grand Opening August 12
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Reservations Open August 12, 2026
          </h2>
          <p className="font-body text-muted-foreground mt-2">
            We&apos;re getting everything ready. Check back soon to book your table.
          </p>
        </div>

        {/* Countdown CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/book"
            className="px-8 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Reserve a Table
          </a>
          <a
            href="/tap-room-society"
            className="px-8 py-3.5 border-2 border-border text-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-secondary transition-all duration-300"
          >
            Join the Society
          </a>
        </div>
      </div>
    </section>
  );
}