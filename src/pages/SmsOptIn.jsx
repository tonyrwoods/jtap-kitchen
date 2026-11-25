import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, CheckCircle2, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SmsOptInField from "@/components/SmsOptInField";
import Tagline from "@/components/Tagline";

export default function SmsOptIn() {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "JTAP Kitchen Text Message Program — SMS Opt-In";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Opt in to JTAP Kitchen SMS text messages: reservation confirmations, reminders, table-ready alerts and updates. Msg & data rates may apply. Reply STOP to cancel, HELP for help.");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("recordSmsOptIn", { phone, sms_opt_in: consent });
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        toast.error(res.data?.error || "Could not record your opt-in.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not record your opt-in. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-foreground text-background py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="font-body text-xs uppercase tracking-[0.35em] font-semibold text-primary mb-3">JTAP Kitchen</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Text Message Program</h1>
          <Tagline className="text-base text-primary mb-4" />
          <p className="font-body text-sm text-background/70 leading-relaxed">
            Choose whether JTAP Kitchen may text you about your visit. You can also opt in when you book a table or join our event waitlist.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {submitted ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-3">You're Opted In</h2>
            <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              JTAP Kitchen may now text <span className="text-foreground font-semibold">{phone}</span> about reservation confirmations, reminders, table-ready alerts, and updates. Reply STOP to cancel, HELP for help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link to="/book" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity">
                Reserve a Table
              </Link>
              <button onClick={() => { setSubmitted(false); setPhone(""); setConsent(false); }} className="px-6 py-3 border border-border rounded-full font-body text-sm font-medium hover:bg-secondary transition-colors">
                Opt In Another Number
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold">JTAP Kitchen SMS Program</h2>
            </div>

            <p className="font-body text-sm text-foreground leading-relaxed">
              JTAP Kitchen sends text messages about <span className="font-semibold">reservation confirmations, reminders, table-ready alerts for our waitlist, and updates about your visit</span>. Message frequency varies: up to 4 messages per reservation and up to 2 messages per waitlist visit. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help. Consent is optional and is not a condition of purchase.
            </p>

            <SmsOptInField
              phone={phone}
              onPhoneChange={setPhone}
              checked={consent}
              onCheckedChange={setConsent}
              messageType="reservation confirmations, reminders, table-ready alerts, and updates"
              frequency="Up to 4 messages per reservation and up to 2 messages per waitlist visit."
            />

            <button type="submit" disabled={submitting || !phone.trim() || !consent}
              className="w-full py-4 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {submitting ? "Recording your opt-in…" : "Agree & Opt In"}
            </button>

            <p className="font-body text-xs text-muted-foreground text-center leading-relaxed">
              Opting in is never required to book a table or place an order. You can withdraw consent at any time by replying STOP.
            </p>
          </form>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
          <Phone className="w-4 h-4 text-primary" />
          <span className="font-body">Questions about our text program? Call 901-213-8085</span>
        </div>
      </div>
    </div>
  );
}