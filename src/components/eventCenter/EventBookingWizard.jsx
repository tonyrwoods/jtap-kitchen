import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import WizardProgress from "./WizardProgress";
import WizardStepPackageDate from "./WizardStepPackageDate";
import WizardStepTalent from "./WizardStepTalent";
import WizardStepAddOns from "./WizardStepAddOns";
import WizardStepContact from "./WizardStepContact";
import { trackPixel } from "@/lib/metaPixel";

const STEPS = ["Package & Date", "Talent", "Add-Ons", "Review & Contact"];
const PACKAGE_PRICES = { "Social Gathering": 1600, "Elevated Experience": 3600, "Full Buyout": 9000 };
const EMPTY = {
  event_type: "", preferred_day: "Flexible", preferred_date: "", guest_count: "",
  package: "Not Sure", selected_talent_ids: [], selected_addon_ids: [], selected_menu_item_ids: [],
  contact_name: "", email: "", phone: "", message: "",
};

export default function EventBookingWizard({ initialPackage, onPackageConsumed, onJoinWaitlist }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [talent, setTalent] = useState([]);
  const [addons, setAddons] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [availability, setAvailability] = useState({});
  const [addonCounts, setAddonCounts] = useState({});
  const [dateBooked, setDateBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const topRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    base44.entities.EventServiceProvider.filter({ is_active: true }, "name", 200).then(setTalent).catch(() => {});
    base44.entities.EventAddOn.filter({ is_active: true }, "name", 200).then(setAddons).catch(() => {});
    base44.entities.MenuItem.list("-created_date", 200).then(setMenuItems).catch(() => {});
  }, []);

  // Prefill package from "Book This Package" CTA
  useEffect(() => {
    if (initialPackage) {
      setForm((f) => ({ ...f, package: initialPackage.value }));
      setStep(0);
      onPackageConsumed?.();
    }
  }, [initialPackage]);

  // Live talent availability + booked-date check when date changes
  useEffect(() => {
    if (!form.preferred_date) {
      setAvailability({});
      setDateBooked(false);
      setAddonCounts({});
      return;
    }
    base44.functions.invoke("getTalentAvailabilityForDate", { date: form.preferred_date })
      .then((res) => {
        const unavailable = res.data?.unavailable || [];
        const map = {};
        talent.forEach((t) => { map[t.id] = !unavailable.includes(t.id); });
        setAvailability(map);
        setDateBooked(!!res.data?.dateBooked);
        setAddonCounts(res.data?.addonCounts || {});
      })
      .catch(() => {
        setAvailability({});
        setDateBooked(false);
        setAddonCounts({});
      });
  }, [form.preferred_date, talent]);

  // Derive preferred_day from the chosen date and compute weekday validity
  const weekdayInvalid = (() => {
    if (!form.preferred_date) return false;
    const d = new Date(form.preferred_date + "T00:00:00").getDay();
    return d < 0 || d > 2;
  })();

  useEffect(() => {
    if (!form.preferred_date) return;
    const d = new Date(form.preferred_date + "T00:00:00").getDay();
    const names = ["Sunday", "Monday", "Tuesday"];
    if (d >= 0 && d <= 2) set("preferred_day", names[d]);
  }, [form.preferred_date]);

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const validateStep = (i) => {
    if (i === 0) {
      if (!form.package) { toast.error("Please choose a package."); return false; }
      if (!form.preferred_date) { toast.error("Please pick an event date."); return false; }
      if (weekdayInvalid) { toast.error("Please pick a Sunday, Monday, or Tuesday."); return false; }
    }
    if (i === STEPS.length - 1) {
      if (!form.contact_name || !form.email) { toast.error("Please enter your name and email."); return false; }
      if (!form.event_type) { toast.error("Please select an event type."); return false; }
      if (!form.guest_count) { toast.error("Please enter a guest count."); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollToTop();
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    scrollToTop();
  };

  const packagePrice = PACKAGE_PRICES[form.package] || 0;
  const estimatedTotal =
    packagePrice +
    addons.filter((a) => form.selected_addon_ids.includes(a.id)).reduce((s, a) => s + Number(a.price || 0), 0) +
    talent.filter((t) => form.selected_talent_ids.includes(t.id)).reduce((s, t) => s + Number(t.base_rate || 0), 0);

  const handleSubmit = async () => {
    if (!validateStep(STEPS.length - 1)) return;
    setSubmitting(true);
    try {
      await base44.functions.invoke("submitEventInquiry", {
        ...form,
        guest_count: parseInt(form.guest_count) || 0,
        event_date: form.preferred_date || null,
        package_name: form.package,
        estimated_total: estimatedTotal,
      });
      trackPixel("Lead", { content_name: "Event Inquiry", content_category: form.package || "Not Sure", value: estimatedTotal, currency: "USD" });
      setSubmitted(true);
    } catch (e) {
      toast.error("Could not submit: " + (e.message || "unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="font-heading text-2xl font-bold mb-3">Inquiry Submitted!</h3>
        <p className="font-body text-muted-foreground mb-6">Thank you! We'll be in touch within 24 hours to discuss your event.</p>
        <button onClick={() => { setSubmitted(false); setForm(EMPTY); setStep(0); }} className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">
          Start a New Inquiry
        </button>
      </div>
    );
  }

  return (
    <div ref={topRef}>
      <div className="text-center mb-6">
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Get Started</p>
        <h2 className="font-heading text-3xl font-bold">Request a Private Event</h2>
        <p className="font-body text-sm text-muted-foreground mt-2">Our events team will respond within 24 hours.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <WizardProgress steps={STEPS} current={step} />
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
            {step === 0 && <WizardStepPackageDate form={form} set={set} dateBooked={dateBooked} onJoinWaitlist={onJoinWaitlist} weekdayInvalid={weekdayInvalid} />}
            {step === 1 && <WizardStepTalent form={form} set={set} talent={talent} availability={availability} preferredDate={form.preferred_date} />}
            {step === 2 && <WizardStepAddOns form={form} set={set} addons={addons} menuItems={menuItems} addonCounts={addonCounts} preferredDate={form.preferred_date} />}
            {step === 3 && <WizardStepContact form={form} set={set} talent={talent} addons={addons} estimatedTotal={estimatedTotal} packagePrice={packagePrice} />}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button type="button" onClick={back} disabled={step === 0} className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Inquiry"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}