import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  contact_name: "", email: "", phone: "",
  preferred_date: "", preferred_day: "Flexible",
  guest_count: "", event_type: "", package: "Not Sure",
};

export default function EventWaitlistSignup({ onClose, prefillDate, prefillDay }) {
  const [form, setForm] = useState({
    ...EMPTY,
    preferred_date: prefillDate || "",
    preferred_day: prefillDay || "Flexible",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name || !form.email) {
      toast.error("Please fill in your name and email.");
      return;
    }
    setSubmitting(true);
    await base44.entities.EventWaitlist.create({
      ...form,
      guest_count: parseInt(form.guest_count) || 0,
    });
    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: "You're on the Waitlist — JTAP Kitchen Event Center",
      body: `Hi ${form.contact_name},\n\nYou've been added to the JTAP Kitchen Event Center waitlist!\n\nWe'll notify you immediately if a spot opens up for ${form.preferred_date || form.preferred_day}. You'll have first priority to book before anyone else.\n\nIf you have questions in the meantime, reach us at events@jtapkitchen.com or (555) 012-3456.\n\n— The JTAP Kitchen Events Team`,
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <h3 className="font-heading text-xl font-bold">Join the Waitlist</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-6">
          That date is fully booked. Join the waitlist and we'll contact you immediately if a spot opens up.
        </p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-heading text-lg font-bold mb-2">You're on the list!</h4>
              <p className="font-body text-sm text-muted-foreground mb-6">
                We'll reach out as soon as a spot becomes available. You have first priority!
              </p>
              <button onClick={onClose}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">
                Close
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Full Name *</label>
                  <input required value={form.contact_name} onChange={e => set("contact_name", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Guest Count</label>
                  <input type="number" min="1" value={form.guest_count} onChange={e => set("guest_count", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. 40" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Preferred Date</label>
                  <input type="date" value={form.preferred_date} onChange={e => set("preferred_date", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Preferred Day</label>
                  <select value={form.preferred_day} onChange={e => set("preferred_day", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    {["Sunday", "Monday", "Tuesday", "Flexible"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Event Type</label>
                  <select value={form.event_type} onChange={e => set("event_type", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select type...</option>
                    {["Birthday Party","Corporate Event","Wedding Reception","Baby/Bridal Shower","Graduation Party","Holiday Party","Other"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Package Interest</label>
                  <select value={form.package} onChange={e => set("package", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    {["Social Gathering","Elevated Experience","Full Buyout","Not Sure"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Joining waitlist..." : "Join Waitlist"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}