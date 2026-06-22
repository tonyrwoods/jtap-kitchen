import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Users, MessageSquare, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

const TIME_SLOTS = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const OPENING_DATE = new Date("2026-07-17");

function isRestaurantOpen(date) {
  const day = date.getDay();
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
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} disabled={!canPrev}
          className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-heading text-sm font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
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
                className={`w-8 h-8 rounded-full text-xs font-body font-medium transition-all duration-200
                  ${isPast(d) || isClosed(d) || isBeforeOpening(d) ? "text-muted-foreground/40 cursor-not-allowed" :
                    isSelected(d) ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" :
                    isToday(d) ? "border border-primary text-primary hover:bg-primary/10" :
                    "text-foreground hover:bg-secondary"}`}
              >
                {d}
              </button>
            ) : <div />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReservationModal({ open, onClose, prefill }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(prefill?.date ? new Date(prefill.date + "T12:00:00") : null);
  const [time, setTime] = useState(prefill?.time || null);
  const [party, setParty] = useState(prefill?.party_size || 2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [special, setSpecial] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open && prefill) {
      setDate(prefill.date ? new Date(prefill.date + "T12:00:00") : null);
      setTime(prefill.time || null);
      setParty(prefill.party_size || 2);
      setStep(1);
    }
  }, [open, prefill]);

  const canNext1 = date && time;
  const canNext2 = name.trim() && email.trim();

  const handleSubmit = async () => {
    if (!date || date < OPENING_DATE) {
      return;
    }
    await base44.entities.Reservation.create({
      guest_name: name,
      email,
      phone,
      date: date?.toISOString().split("T")[0],
      time,
      party_size: party,
      special_requests: special,
      status: "Pending",
    });
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1); setDate(null); setTime(null); setParty(2);
      setName(""); setEmail(""); setPhone(""); setSpecial(""); setSubmitted(false);
    }, 400);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-6 border-b border-border">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.25em] text-primary font-semibold">JTAP Kitchen</p>
                <h2 className="font-heading text-2xl font-bold text-foreground mt-0.5">Reserve a Table</h2>
              </div>
              <button onClick={handleClose}
                className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            {!submitted && (
              <div className="flex items-center gap-2 px-7 py-4 border-b border-border">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-body transition-all duration-300
                      ${step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {s}
                    </div>
                    <span className={`font-body text-xs transition-colors ${step === s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {s === 1 ? "Date & Time" : "Your Details"}
                    </span>
                    {s < 2 && <div className="w-8 h-px bg-border mx-1" />}
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-7 py-6">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-primary" />
                    </motion.div>
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-3">Reservation Confirmed</h3>
                    <p className="font-body text-muted-foreground text-sm leading-relaxed mb-2">
                      We look forward to welcoming you, <span className="text-foreground font-medium">{name}</span>.
                    </p>
                    <p className="font-body text-sm text-primary font-semibold">
                      {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {time} · Party of {party}
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-4">A confirmation has been sent to {email}</p>
                    <button onClick={handleClose}
                      className="mt-8 px-8 py-3 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                      Close
                    </button>
                  </motion.div>
                ) : step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-7"
                  >
                    {/* Date */}
                    <div>
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4">
                        <Calendar className="w-3.5 h-3.5" /> Select Date
                      </label>
                      <div className="bg-secondary/50 rounded-2xl p-4">
                        <MiniCalendar selectedDate={date} onSelect={setDate} />
                      </div>
                      <p className="font-body text-xs text-primary font-semibold mt-2 text-center">Reservations open July 17, 2026</p>
                    </div>

                    {/* Time */}
                    <div>
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
                        <Clock className="w-3.5 h-3.5" /> Select Time
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {TIME_SLOTS.map(t => (
                          <button key={t} onClick={() => setTime(t)}
                            className={`py-2 px-1 rounded-xl text-xs font-body font-medium transition-all duration-200
                              ${time === t ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Party Size */}
                    <div>
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
                        <Users className="w-3.5 h-3.5" /> Party Size
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setParty(p => Math.max(1, p - 1))}
                          className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 font-body text-lg font-medium text-foreground transition-colors flex items-center justify-center">
                          −
                        </button>
                        <span className="font-heading text-3xl font-bold text-foreground w-10 text-center">{party}</span>
                        <button onClick={() => setParty(p => Math.min(12, p + 1))}
                          className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 font-body text-lg font-medium text-foreground transition-colors flex items-center justify-center">
                          +
                        </button>
                        <span className="font-body text-sm text-muted-foreground ml-1">
                          {party === 1 ? "guest" : "guests"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    {/* Summary */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          {date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {time}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">Party of {party}</p>
                      </div>
                      <button onClick={() => setStep(1)} className="ml-auto font-body text-xs text-primary underline underline-offset-2">Edit</button>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Full Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Email Address *</label>
                      <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Phone Number</label>
                      <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>

                    {/* Special Requests */}
                    <div>
                      <label className="flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Special Requests
                      </label>
                      <textarea value={special} onChange={e => setSpecial(e.target.value)}
                        placeholder="Dietary restrictions, allergies, celebrations..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!submitted && (
              <div className="px-7 py-5 border-t border-border bg-card">
                {step === 1 ? (
                  <button onClick={() => setStep(2)} disabled={!canNext1}
                    className="w-full py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/20">
                    Continue
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)}
                      className="px-6 py-4 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                      Back
                    </button>
                    <button onClick={handleSubmit} disabled={!canNext2}
                      className="flex-1 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/20">
                      Confirm Reservation
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}