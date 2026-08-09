import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Music, Camera, Palette, Mic } from "lucide-react";
import { toast } from "sonner";

const SERVICE_CATEGORIES = [
  "DJ / Music", "Live Band / Musicians", "Photography", "Videography",
  "Floral Design", "Event Decor", "Caricature / Entertainment", "Photo Booth",
  "MC / Host", "Event Planning", "Lighting & AV", "Bartending / Mixology",
  "Cake & Desserts", "Hair & Makeup", "Other"
];

const AVAILABILITY_OPTIONS = [
  "Sundays Only", "Mondays Only", "Tuesdays Only", "Sun–Tue (Any)", "Flexible"
];

const HIGHLIGHTS = [
  { icon: Music, label: "DJs & Live Music" },
  { icon: Camera, label: "Photo & Video" },
  { icon: Palette, label: "Décor & Florals" },
  { icon: Mic, label: "MCs & Hosts" },
];

const EMPTY = {
  full_name: "", email: "", phone: "", business_name: "",
  service_category: "", experience_years: "", portfolio_url: "",
  instagram_handle: "", bio: "", availability: "Flexible",
};

export default function EventServiceProviderSignup() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.service_category) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitEventServiceProvider", {
        ...form,
        experience_years: parseFloat(form.experience_years) || 0,
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

  return (
    <section className="py-16 px-6 bg-foreground text-background">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold font-body mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Now Accepting Vendors & Talent
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
            Join Our Event Center Network
          </h2>
          <p className="font-body text-sm text-white/60 max-w-xl mx-auto">
            Are you a creative professional or specialized service provider? Partner with JTAP Kitchen to bring unforgettable experiences to our private events — available Sunday through Tuesday.
          </p>
        </div>

        {/* Highlight icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {HIGHLIGHTS.map(({ icon: HighlightIcon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-xl py-4 px-3">
              <HighlightIcon className="w-5 h-5 text-primary" />
              <span className="font-body text-xs text-white/70 text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Application Submitted!</h3>
              <p className="font-body text-white/60 mb-6">
                Thanks, {form.full_name}! We'll review your application and be in touch soon.
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
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Full Name *</label>
                  <input required value={form.full_name} onChange={e => set("full_name", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Phone</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Business / Brand Name</label>
                  <input value={form.business_name} onChange={e => set("business_name", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your business name" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Service Category *</label>
                  <select required value={form.service_category} onChange={e => set("service_category", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" className="bg-gray-900">Select category...</option>
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Years of Experience</label>
                  <input type="number" min="0" step="1" value={form.experience_years} onChange={e => set("experience_years", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. 5" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Portfolio / Website</label>
                  <input type="url" value={form.portfolio_url} onChange={e => set("portfolio_url", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://yoursite.com" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Instagram Handle</label>
                  <input value={form.instagram_handle} onChange={e => set("instagram_handle", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="@yourhandle" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">Availability</label>
                  <select value={form.availability} onChange={e => set("availability", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm font-semibold mb-1 block text-white/80">About You & Your Services</label>
                  <textarea rows={4} value={form.bio} onChange={e => set("bio", e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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