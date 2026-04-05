import { useState } from "react";
import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await base44.entities.Newsletter.create({ email: email.trim() });
    toast.success("You're subscribed! Welcome to the JTAP Kitchen family.");
    setEmail("");
    setLoading(false);
  };
  return (
    <footer className="bg-foreground text-background py-16 md:py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
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
                { icon: MapPin, text: "248 West Broadway, New York, NY 10013" },
                { icon: Phone, text: "+1 (212) 555-0198" },
                { icon: Mail, text: "hello@aurelian.com" },
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
                { day: "Tue – Thu", time: "5:30 PM – 10:00 PM" },
                { day: "Fri – Sat", time: "5:30 PM – 11:00 PM" },
                { day: "Sunday", time: "5:00 PM – 9:30 PM" },
                { day: "Monday", time: "Closed" },
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

          {/* Social */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-background/40 mb-5">
              Follow Us
            </h4>
            <div className="flex gap-3">
              {["Instagram", "Facebook", "TikTok"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary/80 transition-colors duration-300"
                >
                  <Instagram className="w-4 h-4 text-background/70" />
                </a>
              ))}
            </div>
            <p className="font-body text-sm text-background/50 mt-5">
              @aurelian.dining
            </p>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/10 pt-12 pb-10">
          <div className="max-w-xl mx-auto text-center">
            <p className="font-body text-xs uppercase tracking-[0.25em] font-semibold text-primary mb-3">Stay in the Know</p>
            <h4 className="font-heading text-2xl font-semibold text-background mb-2">Join Our Inner Circle</h4>
            <p className="font-body text-sm text-background/50 mb-6">Be the first to hear about seasonal menus, exclusive events, and chef's specials.</p>
            <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 rounded-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-primary-foreground font-body text-sm font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? "..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-background/40">
            © {new Date().getFullYear()} JTAP Kitchen. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-body text-xs text-background/40 hover:text-background/70 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}