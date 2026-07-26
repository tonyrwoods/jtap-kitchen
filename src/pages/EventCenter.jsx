import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Users, Star, CalendarDays, Phone, Mail, ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import EventWaitlistSignup from "../components/EventWaitlistSignup";

const PACKAGES = [
{
  name: "Social Gathering",
  price: "Starting at $1,600",
  guests: "Up to 30 guests",
  color: "border-amber-200 bg-amber-50/50",
  badge: "bg-amber-100 text-amber-800",
  features: [
  "3-hour exclusive dining room",
  "Welcome cocktail for all guests",
  "Custom appetizer spread",
  "Dedicated server",
  "Basic A/V (Bluetooth speaker)",
  "Complimentary cake cutting"]

},
{
  name: "Elevated Experience",
  price: "Starting at $3,600",
  guests: "30–60 guests",
  color: "border-primary/30 bg-primary/5",
  badge: "bg-primary/15 text-primary",
  featured: true,
  features: [
  "4-hour exclusive private dining space",
  "Champagne toast upon arrival",
  "3-course plated dinner",
  "Signature cocktail menu",
  "Dedicated event coordinator",
  "Custom floral centerpieces",
  "Full A/V setup + projector",
  "Complimentary cake cutting & plating"]

},
{
  name: "Full Buyout",
  price: "Starting at $9,000",
  guests: "60–150 guests",
  color: "border-slate-300 bg-slate-50/50",
  badge: "bg-slate-100 text-slate-700",
  features: [
  "Full restaurant exclusive buyout",
  "Up to 6 hours",
  "Custom prix-fixe menu",
  "Open bar packages available",
  "Personal event planning session",
  "Custom branding & signage",
  "Live entertainment coordination",
  "Valet parking coordination"]

}];


const DAYS = [
{ day: "Sunday", desc: "Perfect for relaxed family celebrations, brunches, or social gatherings in a warm, unhurried atmosphere." },
{ day: "Monday", desc: "Ideal for corporate dinners, team events, or intimate parties — mid-week pricing, full premium service." },
{ day: "Tuesday", desc: "Great for milestone moments. Enjoy exclusive access with our most flexible booking availability." }];


const FAQS = [
{ q: "Can I bring my own cake or decorations?", a: "Yes! You're welcome to bring a custom cake and personal decorations. We provide complimentary cake cutting and setup time 30 minutes before your event." },
{ q: "Is a deposit required to hold the date?", a: "A 25% deposit is required to confirm your booking. The remainder is due 7 days prior to your event." },
{ q: "Do you accommodate dietary restrictions?", a: "Absolutely. Our culinary team can accommodate vegetarian, vegan, gluten-free, and allergy-specific menus with advance notice." },
{ q: "What is the cancellation policy?", a: "Cancellations 14+ days in advance receive a full deposit refund. Cancellations within 7 days forfeit the deposit." }];


function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-body text-sm font-semibold">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      <AnimatePresence>
        {open &&
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="font-body text-sm text-muted-foreground pb-4">{a}</p>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

const EMPTY_FORM = {
  contact_name: "", email: "", phone: "", event_type: "",
  preferred_day: "Flexible", preferred_date: "", guest_count: "",
  package: "Not Sure", message: ""
};

export default function EventCenter() {
  useEffect(() => {
    document.title = "Event Center & Private Events — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Host your next unforgettable event at JTAP Kitchen Event Center in Memphis. Private dining packages for birthdays, corporate events, weddings and more.");
  }, []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Check if a selected date is fully booked
  const isDateFullyBooked = (date) => bookedDates.includes(date);

  const handleDateChange = async (date) => {
    set("preferred_date", date);
    if (!date) return;
    // Fetch existing confirmed inquiries for this date
    const existing = await base44.entities.EventCenterInquiry.filter({ preferred_date: date, status: "Booked" });
    if (existing.length >= 1) {
      setBookedDates((prev) => [...new Set([...prev, date])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name || !form.email || !form.guest_count) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    await base44.entities.EventCenterInquiry.create({
      ...form,
      guest_count: parseInt(form.guest_count) || 0
    });
    await base44.functions.invoke("sendEventInquiryConfirmation", {
      contact_name: form.contact_name,
      email: form.email,
      event_type: form.event_type,
      preferred_day: form.preferred_day,
      preferred_date: form.preferred_date,
      guest_count: form.guest_count,
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Opening Soon Banner */}
      <div className="bg-primary text-primary-foreground py-2.5 px-6 text-center">
        <p className="font-body text-sm font-semibold tracking-wide">🎉 Opening Soon — July 2026 · Inquire now to secure your date before we open!

        </p>
      </div>

      {/* Hero */}
      <div className="relative bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative px-6 py-24 text-center max-w-3xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-body text-xs uppercase tracking-[0.3em] text-white/50 mb-4">
            Private Events
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-heading text-4xl md:text-6xl font-bold mb-4">
            JTAP Kitchen Event Center
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-body text-base text-white/60 max-w-xl mx-auto mb-8">
            Exclusively available Sunday through Tuesday. Host your next unforgettable event with world-class cuisine, impeccable service, and a stunning ambiance.
          </motion.p>
          <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          href="#inquire"
          className="inline-block px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity">
            Inquire Now
          </motion.a>
        </div>
      </div>

      {/* Available Days */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Availability</p>
          <h2 className="font-heading text-3xl font-bold">Sunday · Monday · Tuesday</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DAYS.map(({ day, desc }) =>
          <motion.div key={day} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">{day}</h3>
              <p className="font-body text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Packages */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Packages</p>
            <h2 className="font-heading text-3xl font-bold">Choose Your Experience</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PACKAGES.map((pkg) =>
            <motion.div key={pkg.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className={`relative border-2 rounded-2xl p-7 ${pkg.color} ${pkg.featured ? "shadow-lg scale-[1.02]" : ""}`}>
                {pkg.featured &&
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-primary-foreground rounded-full font-body text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
              }
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold font-body mb-4 ${pkg.badge}`}>
                  {pkg.name}
                </span>
                <p className="font-heading text-2xl font-bold mb-1">{pkg.price}</p>
                <div className="flex items-center gap-1.5 mb-5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-body text-sm text-muted-foreground">{pkg.guests}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {pkg.features.map((f) =>
                <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-body text-sm">{f}</span>
                    </li>
                )}
                </ul>
                <a href="#inquire"
              className="block text-center w-full py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity">
                  Book This Package
                </a>
              </motion.div>
            )}
          </div>
          <p className="text-center font-body text-xs text-muted-foreground mt-6">
            All packages include complimentary consultation. Custom pricing available for larger or specialty events.
          </p>
        </div>
      </div>

      {/* Inquiry Form */}
      <div id="inquire" className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Get Started</p>
          <h2 className="font-heading text-3xl font-bold">Request a Private Event</h2>
          <p className="font-body text-sm text-muted-foreground mt-2">Our events team will respond within 24 hours.</p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ?
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Inquiry Submitted!</h3>
              <p className="font-body text-muted-foreground mb-6">
                Thank you! We'll be in touch within 24 hours to discuss your event.
              </p>
              <button onClick={() => {setSubmitted(false);setForm(EMPTY_FORM);}}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">
                Submit Another Inquiry
              </button>
            </motion.div> :

          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Full Name *</label>
                  <input required value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your name" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@email.com" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Guest Count *</label>
                  <input required type="number" min="1" value={form.guest_count} onChange={(e) => set("guest_count", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 40" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Event Type</label>
                  <select value={form.event_type} onChange={(e) => set("event_type", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select type...</option>
                    {["Birthday Party", "Corporate Event", "Wedding Reception", "Baby/Bridal Shower", "Graduation Party", "Holiday Party", "Other"].map((t) =>
                  <option key={t}>{t}</option>
                  )}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Preferred Day</label>
                  <select value={form.preferred_day} onChange={(e) => set("preferred_day", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    {["Sunday", "Monday", "Tuesday", "Flexible"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Preferred Date</label>
                  <input type="date" value={form.preferred_date} onChange={(e) => handleDateChange(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  {form.preferred_date && isDateFullyBooked(form.preferred_date) &&
                <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-body text-xs text-amber-800">This date is fully booked.</span>
                      <button type="button" onClick={() => setWaitlistOpen(true)}
                  className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900">
                        Join Waitlist
                      </button>
                    </div>
                }
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Package Interest</label>
                  <select value={form.package} onChange={(e) => set("package", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                    {["Social Gathering", "Elevated Experience", "Full Buyout", "Not Sure"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-1 block">Additional Details</label>
                <textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Tell us about your event — theme, special requests, dietary needs, etc." />
              </div>
              <button type="submit" disabled={submitting}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </motion.form>
          }
        </AnimatePresence>

        {/* Waitlist CTA */}
        <div className="mt-6 text-center">
          <p className="font-body text-sm text-muted-foreground">
            Date unavailable?{" "}
            <button onClick={() => setWaitlistOpen(true)}
            className="text-primary font-semibold hover:underline underline-offset-2">
              Join our waitlist
            </button>{" "}
            and we'll contact you when a spot opens up.
          </p>
        </div>

        {/* Location & Contact strip */}
        <div className="mt-8 mb-2 flex flex-col sm:flex-row items-center justify-center gap-2 p-4 bg-muted/40 border border-border rounded-2xl text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="font-body text-sm font-medium text-foreground">Memphis, TN</span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="font-body text-xs text-muted-foreground">Exact address provided upon booking confirmation</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <a href="tel:9012138085" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="w-4 h-4" /> (901) 213-8085
          </a>
          <a href="mailto:info@jtapkitchen.com" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Mail className="w-4 h-4" /> info@jtapkitchen.com
          </a>
        </div>
      </div>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {waitlistOpen && (
          <motion.div key="waitlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EventWaitlistSignup
              onClose={() => setWaitlistOpen(false)}
              prefillDate={form.preferred_date}
              prefillDay={form.preferred_day} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Provider Teaser */}
      <div className="bg-foreground text-background py-12 px-6 text-center">
        <p className="font-body text-xs uppercase tracking-widest text-primary mb-2">Vendors & Talent</p>
        <h2 className="font-heading text-2xl font-bold mb-3">Are You a Creative Professional?</h2>
        <p className="font-body text-sm text-white/60 max-w-md mx-auto mb-6">
          DJs, photographers, florists, MCs & more — partner with JTAP Kitchen to bring your talents to our private events.
        </p>
        <Link to="/vendor-signup"
        className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity">
          Apply to Join Our Network
        </Link>
      </div>

      {/* FAQ */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="bg-card border border-border rounded-2xl px-6">
            {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </div>
    </div>);

}