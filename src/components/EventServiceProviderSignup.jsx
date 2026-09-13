import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Music, Camera, Palette, Mic } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Wedding Planner", "Event Planner", "DJ", "Musician", "Photographer",
  "Florist", "MC / Host", "Clown / Entertainer", "Officiant", "Other"
];

const RATE_UNITS = ["Flat Rate", "Per Hour", "Per Guest"];

const HIGHLIGHTS = [
  { icon: Music, label: "DJs & Live Music" },
  { icon: Camera, label: "Photographers" },
  { icon: Palette, label: "Florists & Décor" },
  { icon: Mic, label: "MCs & Hosts" },
];

const EMPTY = {
  name: "", contact_email: "", category: "", bio: "",
  photo_url: "", base_rate: "", rate_unit: "Flat Rate",
};

export default function EventServiceProviderSignup() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.contact_email || !form.category) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitEventServiceProvider", {
        name: form.name,
        contact_email: form.contact_email,
        category: form.category,
        bio: form.bio,
        photo_url: form.photo_url,
        base_rate: parseFloat(form.base_rate) || 0,
        rate_unit: form.rate_unit,
      });
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        toast.error(res.data?.error || "Could not submit application. Please try again.");
      }
    } catch {
      toast.error("Could not submit application. Please try again.");
    }
    setSubmitting(false);
  };

  const inputCls = "w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <section className="py-16 px-6 bg-foreground text-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold font-body mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Now Accepting Vendors & Talent
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Join Our Event Center Network</h2>
          <p className="font-body text-sm text-white/60 max-w-xl mx-auto">
            Are you a creative professional or specialized service provider? Partner with JTAP Kitchen to bring unforgettable experiences to our private events — available Sunday through Tuesday.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {HIGHLIGHTS.map(({ icon: HighlightIcon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-xl py-4 px-3">
              <HighlightIcon className="w-5 h-5 text-primary" />
              <span className="font-body text-xs text-white/70 text-center">{label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Application Submitted!</h3>
              <p className="font-body text-white/60 mb-6">
                Thanks, {form.name}! We'll review your application and be in touch soon.
              </p>
              <button onClick={() => { setSubmitted(false); setForm(EMPTY); }}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">
                Submit Another
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Name *</label>
                  <input required value={form.name} onChange={e => set("name", e.target.value)}
                    className={inputCls} placeholder="Your name or stage name" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Contact Email *</label>
                  <input required type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)}
                    className={inputCls} placeholder="you@email.com" />
                  <p className="font-body text-xs text-white/40 mt-1">For our team only — never shown to clients.</p>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Category *</label>
                  <select required value={form.category} onChange={e => set("category", e.target.value)}
                    className={inputCls}>
                    <option value="" className="bg-gray-900">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Rate Unit</label>
                  <select value={form.rate_unit} onChange={e => set("rate_unit", e.target.value)}
                    className={inputCls}>
                    {RATE_UNITS.map(u => <option key={u} value={u} className="bg-gray-900">{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Base Rate (USD)</label>
                  <input type="number" min="0" step="0.01" value={form.base_rate} onChange={e => set("base_rate", e.target.value)}
                    className={inputCls} placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Photo URL</label>
                  <input type="url" value={form.photo_url} onChange={e => set("photo_url", e.target.value)}
                    className={inputCls} placeholder="https://...photo.jpg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Bio</label>
                  <textarea rows={4} value={form.bio} onChange={e => set("bio", e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder="Tell us about your experience, style, and what makes you stand out..." />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}