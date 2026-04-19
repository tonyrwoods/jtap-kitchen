import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function EventWaitlistSignup({ event, onClose, onSuccess }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    guest_name: "",
    email: "",
    phone: "",
    party_size: 1,
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.email || !form.party_size) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.EventWaitlist.create({
        event_id: event.id,
        event_title: event.title,
        ...form,
        status: "Waiting",
      });
      setStep("success");
    } catch (error) {
      toast.error("Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        {step === "form" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold">Event Full</h2>
                <p className="font-body text-sm text-muted-foreground">Join the waitlist</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">YOUR NAME *</label>
                <input
                  type="text"
                  required
                  value={form.guest_name}
                  onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">EMAIL *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">PHONE</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                  placeholder="(901) 000-0000"
                />
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">PARTY SIZE *</label>
                <select
                  required
                  value={form.party_size}
                  onChange={e => setForm(f => ({ ...f, party_size: parseInt(e.target.value) }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">SPECIAL REQUESTS</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                  rows={2}
                  placeholder="Dietary restrictions, seating preferences..."
                />
              </div>

              <p className="font-body text-xs text-muted-foreground">
                We'll email you immediately if a spot opens up for {event.title}.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? "Joining..." : "Join Waitlist"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-border rounded-xl font-body text-sm font-semibold hover:bg-muted transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h2 className="font-heading text-2xl font-bold text-center mb-2">You're on the List!</h2>
            <p className="font-body text-muted-foreground text-center mb-6">
              We'll notify you at <strong>{form.email}</strong> immediately if a spot opens up.
            </p>

            <div className="bg-muted p-4 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm font-semibold mb-1">What happens next?</p>
                  <p className="font-body text-xs text-muted-foreground">
                    You'll be contacted as soon as a cancellation occurs. You'll have 24 hours to confirm your booking.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSuccessClose}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-body text-sm font-semibold hover:opacity-90 transition-all"
            >
              Got It
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}