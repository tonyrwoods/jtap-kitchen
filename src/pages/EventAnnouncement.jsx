import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, Users, Ticket, CheckCircle2, PartyPopper, Mail } from "lucide-react";
import SmartImage from "@/components/SmartImage";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${display}:${m} ${ampm}`;
}

export default function EventAnnouncement() {
  const { slug, token } = useParams();
  const [promo, setPromo] = useState(null);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // RSVP form state
  const [rsvpStatus, setRsvpStatus] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [plusOnes, setPlusOnes] = useState("");
  const [dietary, setDietary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (token) {
      base44.functions.invoke("getEventInviteByToken", { token })
        .then((res) => {
          if (res.data?.invite) {
            setInvite(res.data.invite);
            setPromo(res.data.promotion);
            if (res.data.invite.rsvp_status !== "Pending" && res.data.invite.rsvp_responded_at) {
              setRsvpStatus(res.data.invite.rsvp_status);
              setPartySize(res.data.invite.party_size || 1);
              setPlusOnes(res.data.invite.plus_ones || "");
              setDietary(res.data.invite.dietary_notes || "");
              setSubmitted(true);
            }
          } else {
            setNotFound(true);
          }
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    } else if (slug) {
      base44.entities.EventPromotion.filter({ share_slug: slug })
        .then((data) => {
          if (data[0]) setPromo(data[0]);
          else setNotFound(true);
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    }
  }, [slug, token]);

  const submitRSVP = async (e) => {
    e.preventDefault();
    if (!rsvpStatus) { toast.error("Please select a response"); return; }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitEventRSVP", {
        token, rsvp_status: rsvpStatus,
        party_size: partySize, plus_ones: plusOnes, dietary_notes: dietary,
      });
      if (res.data?.success) {
        setInvite(res.data.invite);
        setSubmitted(true);
        toast.success(rsvpStatus === "Attending" ? "See you there!" : "Thanks for your response");
      } else {
        toast.error(res.data?.error || "Failed to submit RSVP");
      }
    } catch {
      toast.error("Failed to submit RSVP");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !promo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <PartyPopper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="font-body text-muted-foreground">This event announcement may have been removed or the link is invalid.</p>
          <a href="/" className="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">Back to Home</a>
        </div>
      </div>
    );
  }

  const isInviteMode = !!token;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero / Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {promo.banner_image_url ? (
          <SmartImage src={promo.banner_image_url} alt={promo.title} imgClassName="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-foreground" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wide mb-3">{promo.event_type}</span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight">{promo.title}</h1>
            {promo.subtitle && <p className="font-body text-base md:text-lg text-white/80 italic mt-2">{promo.subtitle}</p>}
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Event Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {promo.date && (
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <CalendarDays className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-body text-xs text-muted-foreground">Date</p>
              <p className="font-body text-sm font-semibold">{formatDate(promo.date)}</p>
            </div>
          )}
          {promo.time && (
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-body text-xs text-muted-foreground">Time</p>
              <p className="font-body text-sm font-semibold">{formatTime(promo.time)}{promo.end_time ? ` – ${formatTime(promo.end_time)}` : ""}</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-body text-xs text-muted-foreground">Location</p>
            <p className="font-body text-sm font-semibold">{promo.location_label || "JTAP Kitchen"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-body text-xs text-muted-foreground">Admission</p>
            <p className="font-body text-sm font-semibold">{promo.price_per_guest > 0 ? `$${Number(promo.price_per_guest).toFixed(0)}/guest` : "Complimentary"}</p>
          </div>
        </div>

        {/* Host message */}
        {promo.host_message && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
            <p className="font-body text-sm text-foreground leading-relaxed italic">"{promo.host_message}"</p>
            <p className="font-body text-xs text-muted-foreground mt-2">— {promo.host_name}</p>
          </div>
        )}

        {/* Description */}
        {promo.description && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-3">About This Event</h2>
            <p className="font-body text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">{promo.description}</p>
          </div>
        )}

        {promo.rsvp_deadline && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
            <p className="font-body text-sm text-amber-800">Please RSVP by <strong>{formatDate(promo.rsvp_deadline)}</strong></p>
          </div>
        )}

        {/* RSVP Section */}
        {isInviteMode ? (
          submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">
                {invite?.rsvp_status === "Attending" ? "You're In!" : invite?.rsvp_status === "Declined" ? "Response Received" : "Thanks for Responding!"}
              </h2>
              <p className="font-body text-muted-foreground mb-4">
                {invite?.rsvp_status === "Attending"
                  ? `See you at ${promo.title}! ${invite?.party_size > 1 ? `Party of ${invite.party_size}.` : ""}`
                  : `Your response (${invite?.rsvp_status}) has been recorded.`}
              </p>
              <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted">
                Update Response
              </button>
            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submitRSVP} className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold mb-1">RSVP — {invite?.guest_name}</h2>
              <p className="font-body text-sm text-muted-foreground mb-5">Will you be attending {promo.title}?</p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {["Attending", "Maybe", "Declined"].map((opt) => (
                  <button key={opt} type="button" onClick={() => setRsvpStatus(opt)}
                    className={`py-3 rounded-xl font-body text-sm font-semibold border-2 transition-all ${
                      rsvpStatus === opt
                        ? opt === "Attending" ? "border-green-500 bg-green-50 text-green-700"
                          : opt === "Declined" ? "border-red-500 bg-red-50 text-red-700"
                          : "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>

              {rsvpStatus === "Attending" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                  <div>
                    <label className="font-body text-sm font-semibold mb-1.5 block">Party Size (including you)</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-10 h-10 rounded-full border border-border font-bold hover:bg-muted">−</button>
                      <span className="font-heading text-2xl font-bold w-8 text-center">{partySize}</span>
                      <button type="button" onClick={() => setPartySize(Math.min(promo.max_guests || 99, partySize + 1))} className="w-10 h-10 rounded-full border border-border font-bold hover:bg-muted">+</button>
                    </div>
                  </div>
                  {partySize > 1 && (
                    <div>
                      <label className="font-body text-sm font-semibold mb-1.5 block">Guest Names</label>
                      <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={plusOnes} onChange={(e) => setPlusOnes(e.target.value)} placeholder="Names of your guests" />
                    </div>
                  )}
                  <div>
                    <label className="font-body text-sm font-semibold mb-1.5 block">Dietary Notes / Special Requests</label>
                    <textarea rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Allergies, accessibility needs, etc." />
                  </div>
                </motion.div>
              )}

              <button type="submit" disabled={submitting || !rsvpStatus} className="w-full mt-5 py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit RSVP"}
              </button>
            </motion.form>
          )
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Users className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="font-heading text-xl font-bold mb-2">Want to Attend?</h2>
            <p className="font-body text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {promo.max_guests ? `Limited to ${promo.max_guests} guests. ` : ""}Contact us to reserve your spot{promo.host_name ? ` or reach out to ${promo.host_name}` : ""}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:9015544431" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90">Call to Reserve</a>
              <a href="mailto:info@jtapkitchen.com" className="px-6 py-3 border border-border rounded-full font-body text-sm font-semibold hover:bg-muted inline-flex items-center gap-2 justify-center"><Mail className="w-4 h-4" /> Email Us</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}