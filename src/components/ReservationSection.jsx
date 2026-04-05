import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ReservationSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    occasion: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.date || !form.time || !form.guests) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitted(true);
    toast.success("Reservation request sent!");
  };

  if (submitted) {
    return (
      <section id="reserve" className="py-24 md:py-32 bg-secondary/50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Thank You, {form.name}!
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-8 leading-relaxed">
              Your reservation request has been received. We'll confirm your booking
              at <span className="text-foreground font-medium">{form.email}</span> within 24 hours.
            </p>
            <Button
              onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", date: "", time: "", guests: "", occasion: "" }); }}
              variant="outline"
              className="rounded-full px-8 py-3 font-body uppercase tracking-wider text-sm"
            >
              Make Another Reservation
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="reserve" className="py-24 md:py-32 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center"
          >
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Reservations
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6 leading-tight">
              Your Table
              <br />
              <span className="italic font-normal">Awaits</span>
            </h2>
            <p className="font-body text-muted-foreground text-base leading-relaxed mb-10">
              Secure your spot for an unforgettable evening. We recommend booking
              at least 48 hours in advance for weekend dining.
            </p>

            <div className="space-y-6">
              {[
                { icon: CalendarDays, label: "Open 7 Days", desc: "Tuesday – Sunday, 5:30 PM – 11:00 PM" },
                { icon: Clock, label: "Last Seating", desc: "9:30 PM for full tasting menu" },
                { icon: Users, label: "Private Events", desc: "Up to 40 guests in our private dining room" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">{label}</p>
                    <p className="font-body text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-xl shadow-black/5 space-y-5"
            >
              <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">
                Book Your Experience
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Full Name *
                  </label>
                  <Input
                    placeholder="John Smith"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="rounded-xl h-12 font-body"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="john@email.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="rounded-xl h-12 font-body"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Phone
                </label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="rounded-xl h-12 font-body"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className="rounded-xl h-12 font-body"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Time *
                  </label>
                  <Select onValueChange={(val) => handleChange("time", val)}>
                    <SelectTrigger className="rounded-xl h-12 font-body">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {["5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Guests *
                  </label>
                  <Select onValueChange={(val) => handleChange("guests", val)}>
                    <SelectTrigger className="rounded-xl h-12 font-body">
                      <SelectValue placeholder="Party size" />
                    </SelectTrigger>
                    <SelectContent>
                      {["1 Guest", "2 Guests", "3 Guests", "4 Guests", "5 Guests", "6 Guests", "7+ Guests"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Occasion
                  </label>
                  <Select onValueChange={(val) => handleChange("occasion", val)}>
                    <SelectTrigger className="rounded-xl h-12 font-body">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Birthday", "Anniversary", "Date Night", "Business Dinner", "Celebration", "Other"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-13 rounded-full font-body text-sm font-semibold uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-opacity mt-2"
              >
                <Send className="w-4 h-4 mr-2" />
                Request Reservation
              </Button>

              <p className="font-body text-xs text-muted-foreground text-center">
                We'll confirm your reservation via email within 24 hours.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}