import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "info@jtapkitchen.com",
        subject: `New Contact Form: ${form.subject || "General Inquiry"}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not provided"}\n\nMessage:\n${form.message}`,
        from_name: "JTAP Kitchen Contact",
      });
      toast.success("Message sent! We'll be in touch soon.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="font-body text-lg text-muted-foreground">
            Have a question or special request? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Phone</h3>
                  <a href="tel:9015544431" className="font-body text-muted-foreground hover:text-primary">
                    901-554-4431
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Email</h3>
                  <a href="mailto:info@jtapkitchen.com" className="font-body text-muted-foreground hover:text-primary">
                    info@jtapkitchen.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Location</h3>
                  <p className="font-body text-muted-foreground">
                    Memphis, TN
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Hours</h3>
                  <div className="font-body text-sm text-muted-foreground space-y-1">
                    <p>Wed – Thu: 5:30 PM – 10:00 PM</p>
                    <p>Fri – Sat: 5:30 PM – 11:00 PM</p>
                    <p>Sun Brunch: 10:00 AM – 3:00 PM</p>
                    <p>Sun Dinner: 5:00 PM – 10:00 PM</p>
                    <p>Mon – Tue: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm font-semibold text-foreground mb-2 block">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold text-foreground mb-2 block">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-foreground mb-2 block">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-foreground mb-2 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-foreground mb-2 block">
                  Message *
                </label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows="6"
                  className="w-full border border-border rounded-lg px-4 py-2.5 font-body text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell us what you'd like to discuss..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-full font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

              <p className="font-body text-xs text-muted-foreground text-center">
                We'll get back to you as soon as possible, usually within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}