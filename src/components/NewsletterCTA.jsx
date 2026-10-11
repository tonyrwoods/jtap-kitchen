import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackPixel } from "@/lib/metaPixel";
import { toast } from "sonner";

// Mid-page newsletter capture. More prominent than the footer form —
// catches visitors who aren't ready to book yet but want to stay informed
// about events, seasonal menus, and member perks.
export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await base44.functions.invoke("subscribeNewsletter", {
        email: email.trim(),
        source: "homepage_cta",
      });
      base44.analytics.track({
        eventName: "newsletter_signup",
        properties: { source: "homepage_cta" },
      });
      trackPixel("CompleteRegistration", {
        content_name: "Newsletter",
        status: "homepage_cta",
      });
      setDone(true);
      setEmail("");
    } catch {
      toast.error("Could not subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-10 md:p-16 text-center"
        >
          {/* Decorative accent */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-primary-foreground/5" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-foreground/15 mb-6">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>

            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
              Never Miss a Seat
            </h2>
            <p className="font-body text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto mb-8">
              Get first access to ticketed events, seasonal menus, and
              member-only perks — delivered straight to your inbox.
            </p>

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 text-primary-foreground font-body font-medium"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  You're on the list — welcome to the JTAP family!
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-5 py-3.5 rounded-full bg-primary-foreground text-foreground font-body text-sm placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3.5 rounded-full bg-foreground text-background font-body text-sm font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      "Subscribing…"
                    ) : (
                      <>
                        Subscribe <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="font-body text-xs text-primary-foreground/60 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}