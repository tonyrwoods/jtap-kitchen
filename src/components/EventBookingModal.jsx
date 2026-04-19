import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Users, Clock, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import EventWaitlistSignup from "./EventWaitlistSignup";

export default function EventBookingModal({ event, onClose, onBookingComplete }) {
  const [step, setStep] = useState(1);
  const [guestCount, setGuestCount] = useState(1);
  const [form, setForm] = useState({
    guest_name: "",
    email: "",
    phone: "",
    special_requests: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const soldOut = event.spots_available <= 0;

  const totalPrice = (event.price_per_guest || 0) * guestCount;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (guestCount > event.spots_available) {
      toast.error("Not enough spots available");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Reservation.create({
        guest_name: form.guest_name,
        email: form.email,
        phone: form.phone,
        date: event.date,
        time: event.time,
        party_size: guestCount,
        special_requests: form.special_requests || `Event: ${event.title}`,
        status: "Pending"
      });

      // Update available spots
      await base44.entities.Event.update(event.id, {
        spots_available: event.spots_available - guestCount
      });

      toast.success("Booking submitted! Check your email for confirmation.");
      onBookingComplete();
      onClose();
    } catch (error) {
      toast.error("Booking failed. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card/95 backdrop-blur-sm">
              <h2 className="font-heading text-xl font-bold text-foreground">{event.title}</h2>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Event Details */}
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover rounded-2xl" />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="font-body text-xs text-muted-foreground mb-0.5">Date</p>
                  <p className="font-heading text-sm font-semibold">{event.date}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="font-body text-xs text-muted-foreground mb-0.5">Time</p>
                  <p className="font-heading text-sm font-semibold">{event.time}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="font-body text-xs text-muted-foreground mb-0.5">Duration</p>
                  <p className="font-heading text-sm font-semibold">{event.duration_minutes}m</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="font-body text-xs text-muted-foreground mb-0.5">Available</p>
                  <p className="font-heading text-sm font-semibold">{event.spots_available} spots</p>
                </div>
              </div>

              {event.description && (
                <div>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                </div>
              )}

              {event.menu_details && (
                <div className="bg-secondary/40 rounded-lg p-4">
                  <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Menu / Itinerary</p>
                  <p className="font-body text-sm text-foreground whitespace-pre-line">{event.menu_details}</p>
                </div>
              )}

              {/* Sold Out Notice */}
              {soldOut && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="text-amber-600 text-lg mt-0.5">⚠</div>
                  <div>
                    <p className="font-body font-semibold text-amber-900 mb-1">This event is sold out</p>
                    <p className="font-body text-sm text-amber-800 mb-2">Join the waitlist to be notified if a spot opens up.</p>
                    <button
                      type="button"
                      onClick={() => setShowWaitlist(true)}
                      className="text-sm font-semibold text-amber-700 hover:text-amber-800 underline"
                    >
                      Join Waitlist →
                    </button>
                  </div>
                </div>
              )}

            {/* Booking Form */}
              {!soldOut && (
              <form onSubmit={handleBooking} className="space-y-4 border-t border-border pt-6">
                <div>
                  <label className="font-body text-xs font-semibold text-muted-foreground mb-2 block">
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={event.spots_available}
                      value={guestCount}
                      onChange={e => setGuestCount(Math.min(event.spots_available, parseInt(e.target.value) || 1))}
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-center font-body text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.min(event.spots_available, guestCount + 1))}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {guestCount > event.spots_available && (
                    <p className="font-body text-xs text-destructive mt-1">Not enough spots available</p>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">${event.price_per_guest} × {guestCount} guests</span>
                    <span className="font-heading text-lg font-bold text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Name *</label>
                    <input
                      required
                      value={form.guest_name}
                      onChange={e => setForm({...form, guest_name: e.target.value})}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>

                <div>
                  <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Special Requests</label>
                  <textarea
                    value={form.special_requests}
                    onChange={e => setForm({...form, special_requests: e.target.value})}
                    rows={2}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-5 py-3 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || guestCount > event.spots_available}
                    className="flex-1 px-5 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? "Booking..." : "Book Now"}
                  </button>
                </div>
              </form>
              )}
            </div>

            {showWaitlist && (
              <EventWaitlistSignup event={event} onClose={() => setShowWaitlist(false)} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}