import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, Users, Check, X, Send, Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";

const STATUS = {
  Attending: { icon: Check, color: "bg-green-100 text-green-700" },
  Declined: { icon: X, color: "bg-red-100 text-red-700" },
  Pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ReservationConfirm() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    base44.functions.invoke("getReservationByToken", { token })
      .then((res) => {
        if (!res.data || res.data.error) setError(res.data?.error || "Not found");
        else setData(res.data);
      })
      .catch(() => setError("Unable to load reservation"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (mode, action) => {
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitReservationRSVP", { token, mode, action });
      if (res.data?.success) {
        toast.success(action === "confirm" || action === "attending" ? "You're confirmed!" : "Thanks for letting us know");
        load();
      } else {
        toast.error(res.data?.error || "Failed to submit");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const sendCompanion = async (e) => {
    e.preventDefault();
    if (!cName.trim() || !cEmail.trim()) { toast.error("Name and email required"); return; }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendCompanionInvite", { reservation_token: token, name: cName.trim(), email: cEmail.trim() });
      if (res.data?.success) {
        toast.success(`Invite sent to ${cName.trim()}`);
        setCName(""); setCEmail("");
        load();
      } else {
        toast.error(res.data?.error || "Failed to send invite");
      }
    } catch {
      toast.error("Failed to send invite");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <X className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Reservation Not Found</h1>
        <p className="font-body text-muted-foreground">This link is invalid or has expired.</p>
        <a href="/" className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Back to Home</a>
      </div>
    );
  }

  const { mode, reservation, companions, invite } = data;

  // ---------- COMPANION VIEW ----------
  if (mode === "companion") {
    const status = invite?.rsvp_status || "Pending";
    const responded = status !== "Pending";
    return (
      <div className="min-h-screen bg-background">
        <div className="relative bg-foreground text-background py-16 px-6 text-center">
          <p className="font-body text-xs uppercase tracking-[0.35em] text-primary mb-3">JTAP Kitchen</p>
          <h1 className="font-heading text-4xl font-bold">You're Invited</h1>
        </div>
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="font-body text-muted-foreground mb-1">{reservation?.guest_name} has invited you to join their table</p>
            <h2 className="font-heading text-2xl font-bold mb-6">Dinner at JTAP Kitchen</h2>
            <div className="grid grid-cols-2 gap-4 text-left mb-8">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary shrink-0" /><span className="font-body text-sm">{formatDate(reservation?.date)}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary shrink-0" /><span className="font-body text-sm">{reservation?.time}</span></div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary shrink-0" /><span className="font-body text-sm">Party of {reservation?.party_size}</span></div>
            </div>
            {responded ? (
              <div className="py-6">
                {status === "Attending" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" /></div>
                    <p className="font-heading text-xl font-bold">See you there!</p>
                    <p className="font-body text-sm text-muted-foreground mt-1">You're confirmed for {formatDate(reservation?.date)} at {reservation?.time}.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><X className="w-8 h-8 text-red-600" /></div>
                    <p className="font-heading text-xl font-bold">You've declined</p>
                    <p className="font-body text-sm text-muted-foreground mt-1">Thanks for letting us know — we hope to see you another time.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => submit("companion", "attending")} disabled={submitting} className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {submitting ? "Confirming..." : "I'm Attending"}
                </button>
                <button onClick={() => submit("companion", "declined")} disabled={submitting} className="flex-1 py-3.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-50">
                  {submitting ? "..." : "Can't Make It"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- HOLDER VIEW ----------
  const confirmed = !!reservation?.confirmed_at;
  const declined = !!reservation?.declined_at;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-foreground text-background py-16 px-6 text-center">
        <p className="font-body text-xs uppercase tracking-[0.35em] text-primary mb-3">JTAP Kitchen</p>
        <h1 className="font-heading text-4xl font-bold">Confirm Your Reservation</h1>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading text-xl font-bold">{reservation.guest_name}</h2>
              <p className="font-body text-sm text-muted-foreground">{reservation.email}</p>
            </div>
            {confirmed && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shrink-0"><Check className="w-3.5 h-3.5" /> Confirmed</span>}
            {declined && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold shrink-0"><X className="w-3.5 h-3.5" /> Cancelled</span>}
            {!confirmed && !declined && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold shrink-0"><Clock className="w-3.5 h-3.5" /> Pending</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary shrink-0" /><span className="font-body text-sm">{formatDate(reservation.date)}</span></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary shrink-0" /><span className="font-body text-sm">{reservation.time}</span></div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary shrink-0" /><span className="font-body text-sm">Party of {reservation.party_size}</span></div>
          </div>
          {reservation.special_requests && <p className="font-body text-xs text-muted-foreground mt-4 pt-4 border-t border-border italic">"{reservation.special_requests}"</p>}
        </div>

        {!confirmed && !declined && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <p className="font-body text-sm text-muted-foreground mb-4">Please confirm your reservation so we can hold your table.</p>
            <div className="flex gap-3">
              <button onClick={() => submit("holder", "confirm")} disabled={submitting} className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {submitting ? "Confirming..." : "Confirm Reservation"}
              </button>
              <button onClick={() => submit("holder", "decline")} disabled={submitting} className="flex-1 py-3.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-50">
                {submitting ? "..." : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"><PartyPopper className="w-7 h-7 text-green-600" /></div>
            <p className="font-heading text-lg font-bold text-green-900">Your table is confirmed!</p>
            <p className="font-body text-sm text-green-700 mt-1">We look forward to hosting you on {formatDate(reservation.date)} at {reservation.time}.</p>
          </div>
        )}

        {declined && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="font-heading text-lg font-bold text-red-900">Reservation cancelled</p>
            <p className="font-body text-sm text-red-700 mt-1">Your reservation has been cancelled. We hope to welcome you another time.</p>
          </div>
        )}

        {confirmed && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-primary" /><h3 className="font-heading text-base font-semibold">Invite Your Party</h3></div>
            <p className="font-body text-xs text-muted-foreground mb-4">Send RSVP links to your dining companions so they can confirm too.</p>
            <form onSubmit={sendCompanion} className="flex flex-col sm:flex-row gap-2 mb-4">
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Companion name" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="email@example.com" type="email" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              <button type="submit" disabled={sending} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 justify-center">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send</>}
              </button>
            </form>
            {companions && companions.length > 0 ? (
              <div className="space-y-1.5">
                {companions.map((c) => {
                  const cfg = STATUS[c.rsvp_status] || STATUS.Pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate">{c.guest_name}</p>
                        <p className="font-body text-xs text-muted-foreground truncate">{c.guest_email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}><Icon className="w-3 h-3" /> {c.rsvp_status}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-body text-xs text-muted-foreground text-center py-2">No companions invited yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}