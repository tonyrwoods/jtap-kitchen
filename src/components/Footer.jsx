import { useState } from "react";
import { MapPin, Phone, Mail, Instagram, Clock, Send, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Footer({ onBookTable }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false); // false | true | "done"

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await base44.entities.Subscriber.create({ name: name.trim(), email: email.trim(), source: "footer", is_active: true });
    await base44.functions.invoke("sendNewsletterConfirmation", { name: name.trim(), email: email.trim() });
    setName("");
    setEmail("");
    setLoading("done");
  };
  return (
    <footer className="bg-foreground text-background py-16 md:py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Newsletter */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-background/5 border border-background/10 rounded-3xl px-8 py-10 md:px-12 md:py-12 text-center">
              <p className="font-body text-xs uppercase tracking-[0.3em] font-semibold text-primary mb-3">Stay in the Know</p>
              <h4 className="font-heading text-3xl md:text-4xl font-semibold text-background mb-3 leading-tight">
                Join Our Inner Circle
              </h4>
              <p className="font-body text-sm text-background/50 mb-8 max-w-md mx-auto leading-relaxed">
                Be the first to hear about seasonal menus, exclusive chef's table events, and special announcements — delivered straight to your inbox.
              </p>

              <AnimatePresence mode="wait">
                {loading === "done" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-2"
                  >
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                    <p className="font-body text-sm font-semibold text-background">You're on the list — welcome to the family!</p>
                    <p className="font-body text-xs text-background/40">Expect seasonal news, exclusive events & chef's specials.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubscribe}
                    className="flex flex-col gap-3 max-w-md mx-auto"
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-5 py-3.5 rounded-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm focus:outline-none focus:border-primary focus:bg-background/15 transition-all"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/30 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm focus:outline-none focus:border-primary focus:bg-background/15 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading === true}
                        className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-primary/20"
                      >
                        {loading === true ? (
                          <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Subscribe
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <p className="font-body text-xs text-background/30 mt-5">No spam, ever. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="font-heading text-3xl font-semibold mb-4">JTAP Kitchen</h3>
            <p className="font-body text-sm text-background/60 leading-relaxed max-w-xs">
              JTAP Kitchen — an intimate fine dining experience where culinary artistry meets
              timeless hospitality.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-background/40 mb-5">
              Contact
            </h4>
            <div className="space-y-4">
              {[
                { icon: MapPin, text: "3397 Summer Ave., Memphis TN 38122" },
                { icon: Phone, text: "901-554-4431" },
                { icon: Mail, text: "info@jtapkitchen.com" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-body text-sm text-background/70">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-background/40 mb-5">
              Hours
            </h4>
            <div className="space-y-3">
              {[
                { day: "Wed – Thu", time: "5:30 PM – 10:00 PM" },
                { day: "Fri – Sat", time: "5:30 PM – 11:00 PM" },
                { day: "Sunday Brunch", time: "10:00 AM – 3:00 PM" },
                { day: "Sunday Dinner", time: "5:00 PM – 10:00 PM" },
                { day: "Mon – Tue", time: "Closed" },
              ].map(({ day, time }) => (
                <div key={day} className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-body text-sm text-background/70">
                    <span className="text-background/90 font-medium">{day}</span> — {time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-background/40 mb-5">
              Quick Links
            </h4>
            <div className="space-y-3">
              {[
                { label: "Our Menu", href: "/menu" },
                { label: "Reserve a Table", href: null, action: "reserve" },
                { label: "Event Center", href: "/event-center" },
                { label: "Gift Cards", href: "/gift-cards" },
                { label: "Careers", href: "/careers" },
                { label: "Vendor / Talent Signup", href: "/vendor-signup" },
                { label: "Contact Us", href: "/contact" },
                { label: "Support", href: "/support" },
                { label: "Login", href: null },
              ].map(({ label, href, action }) => (
                <a
                  key={label}
                  href={href || "#"}
                  onClick={(e) => {
                    if (action === "reserve") {
                      e.preventDefault();
                      if (onBookTable) onBookTable();
                    } else if (label === "Login") {
                      e.preventDefault();
                      import("@/api/base44Client").then(({ base44 }) => base44.auth.redirectToLogin("https://jtapkitchen.com/admin"));
                    }
                  }}
                  className="block font-body text-sm text-background/60 hover:text-primary transition-colors duration-200"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-background/40 mb-5">
              Follow Us
            </h4>
            <a
              href="https://www.instagram.com/jtapkitchen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-background/10 hover:bg-primary/80 transition-colors duration-300"
            >
              <Instagram className="w-4 h-4 text-background/70" />
              <span className="font-body text-sm text-background/60">@jtapkitchen</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-background/40">
            © {new Date().getFullYear()} JTAP Kitchen. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="/privacy-policy" className="font-body text-xs text-background/40 hover:text-background/70 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="font-body text-xs text-background/40 hover:text-background/70 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}