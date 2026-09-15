import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Users, Star, CalendarDays, Phone, Mail, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import EventWaitlistSignup from "../components/EventWaitlistSignup";
import EventBookingWizard from "../components/eventCenter/EventBookingWizard";

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
{ q: "Is a deposit required to hold the date?", a: "Yes — a flat-rate deposit secures your date: $250 for Social Gathering, $500 for Elevated Experience, and $1,000 for Full Buyout. The remaining balance is due 7 days prior to your event." },
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

export default function EventCenter() {
  useEffect(() => {
    document.title = "Event Center & Private Events — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Host your next unforgettable event at JTAP Kitchen Event Center in Memphis. Private dining packages for birthdays, corporate events, weddings and more.");
  }, []);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPrefill, setWaitlistPrefill] = useState({ date: "", day: "Flexible" });
  const [presetPackage, setPresetPackage] = useState(null);

  const handleBookPackage = (pkg) => {
    setPresetPackage({ value: pkg.name, name: pkg.name });
    document.getElementById("inquire")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openWaitlist = (date, day) => {
    setWaitlistPrefill({ date: date || "", day: day || "Flexible" });
    setWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Opening Soon Banner */}
      <div className="bg-primary text-primary-foreground py-2.5 px-6 text-center">
        <p className="font-body text-sm font-semibold tracking-wide">🎉 Opening 'Full Services' soon · Call to hear about current Event offerings!

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
                <button type="button" onClick={() => handleBookPackage(pkg)}
              className="block text-center w-full py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity">
                  Book This Package
                </button>
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
        <EventBookingWizard
          initialPackage={presetPackage}
          onPackageConsumed={() => setPresetPackage(null)}
          onJoinWaitlist={openWaitlist}
        />

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
              prefillDate={waitlistPrefill.date}
              prefillDay={waitlistPrefill.day} />
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