import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";

function groupSlotsByDate(slots) {
  return slots.reduce((acc, slot) => {
    const d = slot.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {});
}

export default function ScheduleInterview() {
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams.get("app_id");

  const [application, setApplication] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appId) { setError("Invalid link."); setLoading(false); return; }

    Promise.all([
      base44.entities.JobApplication.filter({ id: appId }),
      base44.entities.InterviewSlot.filter({ is_booked: false }, "date", 100),
    ]).then(([apps, openSlots]) => {
      if (!apps[0]) { setError("Application not found."); setLoading(false); return; }
      setApplication(apps[0]);
      // Only show future slots
      const today = new Date().toISOString().slice(0, 10);
      setSlots(openSlots.filter(s => s.date >= today));
      setLoading(false);
    });
  }, [appId]);

  const handleBook = async () => {
    if (!selected) return;
    setBooking(true);

    // Update slot as booked
    await base44.entities.InterviewSlot.update(selected.id, {
      is_booked: true,
      booked_by_application_id: appId,
      booked_by_name: application.applicant_name,
    });

    // Update application status
    await base44.entities.JobApplication.update(appId, {
      status: "Interview Scheduled",
      interview_slot_id: selected.id,
      interview_date: selected.date,
      interview_time: selected.start_time,
    });

    // Send confirmation email to candidate
    await base44.integrations.Core.SendEmail({
      to: application.email,
      subject: "Interview Confirmed — JTAP Kitchen",
      body: `Hi ${application.applicant_name},\n\nYour interview for ${application.job_title} has been confirmed!\n\nDate: ${format(parseISO(selected.date), "EEEE, MMMM d, yyyy")}\nTime: ${selected.start_time} – ${selected.end_time}\nLocation: ${selected.location || "JTAP Kitchen – In Person"}\n\nWe look forward to meeting you!\n\n— The JTAP Kitchen Team`,
    });

    setBooked(true);
    setBooking(false);
  };

  const grouped = groupSlotsByDate(slots);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
      <p className="font-body text-muted-foreground">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background py-16 px-6 text-center">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-white/50 mb-3">JTAP Kitchen</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Schedule Your Interview</h1>
        {application && (
          <p className="font-body text-sm text-white/60">
            Hi {application.applicant_name} — select a time for your <strong className="text-white/80">{application.job_title}</strong> interview.
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {booked ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-3">Interview Confirmed!</h2>
              <p className="font-body text-muted-foreground mb-6">
                Your interview is booked for <strong>{format(parseISO(selected.date), "EEEE, MMMM d, yyyy")}</strong> at <strong>{selected.start_time}</strong>.
              </p>
              <div className="bg-card border border-border rounded-2xl p-6 text-left max-w-sm mx-auto space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-body text-sm">{format(parseISO(selected.date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-body text-sm">{selected.start_time} – {selected.end_time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-body text-sm">{selected.location || "JTAP Kitchen – In Person"}</span>
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-6">A confirmation has been sent to {application.email}.</p>
            </motion.div>
          ) : slots.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">No slots available yet</h3>
              <p className="font-body text-sm text-muted-foreground">
                Our team is working on scheduling. We'll be in touch soon at {application?.email}.
              </p>
            </motion.div>
          ) : (
            <motion.div key="slots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <p className="font-body text-sm text-muted-foreground">Choose a date and time that works for you:</p>

              {Object.entries(grouped).sort().map(([date, daySlots]) => (
                <div key={date}>
                  <h3 className="font-heading text-base font-semibold mb-3">
                    {format(parseISO(date), "EEEE, MMMM d")}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {daySlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelected(slot)}
                        className={`p-4 border rounded-xl text-left transition-all ${
                          selected?.id === slot.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span className="font-body text-sm font-semibold">{slot.start_time}</span>
                        </div>
                        <p className="font-body text-xs text-muted-foreground">{slot.start_time} – {slot.end_time}</p>
                        {slot.location && (
                          <p className="font-body text-xs text-muted-foreground mt-1 truncate">{slot.location}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-body text-sm font-semibold">Selected Slot</p>
                    <p className="font-body text-sm text-muted-foreground">
                      {format(parseISO(selected.date), "EEEE, MMM d")} · {selected.start_time} – {selected.end_time}
                    </p>
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                  >
                    {booking ? "Booking..." : "Confirm This Slot"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}