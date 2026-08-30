import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Users, MessageSquare, ChevronLeft, ChevronRight, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import CompanionInviteForm from "@/components/CompanionInviteForm";

const TIME_SLOTS = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM",
];

const BRUNCH_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const OPENING_DATE = new Date("2026-08-12");

function isSunday(date) {
  return date.getDay() === 0;
}

function isRestaurantOpen(date) {
  const day = date.getDay(); // 0=Sun,1=Mon,...,6=Sat
  return day !== 1 && day !== 2; // closed Mon & Tue
}

function MiniCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isBeforeOpening = (d) => new Date(year, month, d) < OPENING_DATE;
  const isClosed = (d) => !isRestaurantOpen(new Date(year, month, d));
  const isSelected = (d) => selectedDate &&
    selectedDate.getDate() === d &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;
  const isToday = (d) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const canPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} disabled={!canPrev}
          className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-heading text-base font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-3">
        {DAYS.map(d => (
          <div key={d} className="text-center font-body text-xs text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            {d ? (
              <button
                disabled={isPast(d) || isClosed(d) || isBeforeOpening(d)}
                onClick={() => onSelect(new Date(year, month, d))}
                title={isClosed(d) && !isPast(d) ? "Closed" : isBeforeOpening(d) && !isPast(d) ? "Not yet available" : undefined}
                className={`w-9 h-9 rounded-full text-sm font-body font-medium transition-all duration-200
                  ${isPast(d) || isClosed(d) || isBeforeOpening(d) ? "text-muted-foreground/30 cursor-not-allowed" :
                    isSelected(d) ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" :
                    isToday(d) ? "border-2 border-primary text-primary hover:bg-primary/10" :
                    "text-foreground hover:bg-secondary"}`}
              >
                {d}
              </button>
            ) : <div />}
          </div>
        ))}
      </div>
      <p className="font-body text-xs text-muted-foreground mt-3 text-center">Closed Mondays & Tuesdays</p>
      <p className="font-body text-xs text-primary font-semibold mt-1 text-center">Reservations open August 12, 2026</p>
    </div>
  );
}

export default function BookTable() {
  useEffect(() => {
    document.title = "Reserve a Table at JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Reserve a table at JTAP Kitchen in Memphis. Choose your date, time, and party size — instant confirmation.");
  }, []);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [party, setParty] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [special, setSpecial] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reservationToken, setReservationToken] = useState(null);
  const [reservationId, setReservationId] = useState(null);

  const canNext1 = date && time;
  const canNext2 = name.trim() && email.trim();

  const isSun = date ? isSunday(date) : false;
  const slots = TIME_SLOTS;

  const handleDateSelect = (d) => {
    setDate(d);
    setTime(null); // reset time when date changes
  };

  const handleSubmit = async () => {
    if (!date || date < OPENING_DATE) {
      toast.error("Reservations open August 12, 2026. Please select a date on or after that.");
      return;
    }
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await base44.functions.invoke("submitReservation", {
        guest_name: name,
        email,
        phone,
        date: dateStr,
        time,
        party_size: party,
        special_requests: special,
      });
      if (res.data?.success) {
        setReservationToken(res.data.reservation.confirm_token);
        setReservationId(res.data.reservation.id);
        base44.analytics.track({ eventName: "reservation_created", properties: { party_size: party, date: dateStr } });
        setSubmitted(true);
      } else {
        toast.error(res.data?.error || "Unable to create reservation.");
      }
    } catch (error) {
      toast.error("Unable to verify availability. Please try again.");
    }
    setLoading(false);
  };

  const reset = () => {
    setStep(1); setDate(null); setTime(null); setParty(2);
    setName(""); setEmail(""); setPhone(""); setSpecial(""); setSubmitted(false);
    setReservationToken(null); setReservationId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-foreground text-background py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-xl mx-auto">
          <p className="font-body text-xs uppercase tracking-[0.35em] font-semibold text-primary mb-3">JTAP Kitchen</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Reserve a Table</h1>
          <p className="font-body text-background/60 text-sm leading-relaxed">
            Great food, good company, and a table with your name on it. Book in just a few steps.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-3">You're All Set!</h2>
              <p className="font-body text-muted-foreground mb-2">
                We look forward to welcoming you, <span className="text-foreground font-semibold">{name}</span>.
              </p>
              <p className="font-body text-primary font-semibold text-lg mt-4">
                {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {time}
              </p>
              <p className="font-body text-muted-foreground text-sm mt-1">Party of {party}</p>
              <p className="font-body text-xs text-muted-foreground mt-6">A confirmation will be sent to <span className="text-foreground">{email}</span></p>
              <div className="flex gap-3 justify-center mt-10">
                <button onClick={reset}
                  className="px-8 py-3 border border-border rounded-full font-body text-sm font-medium hover:bg-secondary transition-colors">
                  Make Another Reservation
                </button>
                <a href="/"
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity">
                  Back to Home
                </a>
              </div>

              {reservationToken && reservationId && (
                <div className="mt-10 text-left">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <Mail className="w-4 h-4 text-primary" />
                    <p className="font-body text-sm font-semibold text-foreground">Invite your dining companions</p>
                  </div>
                  <CompanionInviteForm confirmToken={reservationToken} reservationId={reservationId} partySize={party} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-4 mb-10">
                {[{ n: 1, label: "Date & Time" }, { n: 2, label: "Your Details" }].map(({ n, label }, i) => (
                  <div key={n} className="flex items-center gap-3">
                    {i > 0 && <div className="w-12 h-px bg-border" />}
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-body transition-all duration-300
                        ${step >= n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        {n}
                      </div>
                      <span className={`font-body text-sm transition-colors ${step === n ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-8"
                  >
                    {/* Calendar */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
                        <Calendar className="w-3.5 h-3.5" /> Select Date
                      </label>
                      <MiniCalendar selectedDate={date} onSelect={handleDateSelect} />
                    </div>

                    {/* Time Slots */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4">
                        <Clock className="w-3.5 h-3.5" /> Select Time
                        {isSun && <span className="text-primary font-normal normal-case tracking-normal">– Brunch coming soon</span>}
                      </label>
                      {!date ? (
                        <p className="font-body text-sm text-muted-foreground text-center py-4">Please select a date first</p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {slots.map(t => (
                            <button key={t} onClick={() => setTime(t)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-body font-medium transition-all duration-200
                                ${time === t ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Party Size */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
                        <Users className="w-3.5 h-3.5" /> Party Size
                      </label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setParty(p => Math.max(1, p - 1))}
                          className="w-11 h-11 rounded-full bg-secondary hover:bg-secondary/80 font-body text-xl font-medium text-foreground transition-colors flex items-center justify-center">
                          −
                        </button>
                        <span className="font-heading text-4xl font-bold text-foreground w-12 text-center">{party}</span>
                        <button onClick={() => setParty(p => Math.min(12, p + 1))}
                          className="w-11 h-11 rounded-full bg-secondary hover:bg-secondary/80 font-body text-xl font-medium text-foreground transition-colors flex items-center justify-center">
                          +
                        </button>
                        <span className="font-body text-sm text-muted-foreground ml-1">{party === 1 ? "guest" : "guests"}</span>
                      </div>
                      {party > 8 && (
                        <p className="font-body text-xs text-primary mt-3">For parties larger than 8, we recommend calling us directly at 901-233-4060.</p>
                      )}
                    </div>

                    <button onClick={() => setStep(2)} disabled={!canNext1}
                      className="w-full py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/20">
                      Continue
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    {/* Booking summary */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-body font-semibold text-foreground">
                          {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                        <p className="font-body text-sm text-muted-foreground">{time} · Party of {party}</p>
                      </div>
                      <button onClick={() => setStep(1)} className="font-body text-xs text-primary underline underline-offset-2 shrink-0">
                        Edit
                      </button>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                      <div>
                        <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Full Name *</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Email Address *</label>
                        <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Phone Number</label>
                        <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
                          <MessageSquare className="w-3.5 h-3.5" /> Special Requests
                        </label>
                        <textarea value={special} onChange={e => setSpecial(e.target.value)}
                          placeholder="Dietary restrictions, allergies, special occasions..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)}
                        className="px-6 py-4 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                        Back
                      </button>
                      <button onClick={handleSubmit} disabled={!canNext2 || loading}
                        className="flex-1 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/20">
                        {loading ? "Confirming..." : "Confirm Reservation"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}