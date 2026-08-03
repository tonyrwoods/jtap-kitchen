import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Send, Loader2, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS = {
  Attending: { icon: Check, color: "bg-green-100 text-green-700" },
  Declined: { icon: X, color: "bg-red-100 text-red-700" },
  Pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
};

export default function CompanionInviteForm({ confirmToken, reservationId, partySize = 2 }) {
  const [companions, setCompanions] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadCompanions = useCallback(async () => {
    try {
      const invites = await base44.entities.ReservationInvite.filter({ reservation_id: reservationId });
      setCompanions(invites);
    } catch {
      // ignore — not critical
    }
    setLoaded(true);
  }, [reservationId]);

  useEffect(() => { loadCompanions(); }, [loadCompanions]);

  const send = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email required");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendCompanionInvite", {
        reservation_token: confirmToken,
        name: name.trim(),
        email: email.trim(),
      });
      if (res.data?.success) {
        toast.success(`Invite sent to ${name.trim()}`);
        setName("");
        setEmail("");
        loadCompanions();
      } else {
        toast.error(res.data?.error || "Failed to send invite");
      }
    } catch {
      toast.error("Failed to send invite");
    }
    setSending(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-left">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-base font-semibold">Invite Your Party</h3>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">
        Send RSVP links to your dining companions so they can confirm too.
        {partySize > 1 && <span className="text-muted-foreground/70"> (Up to {partySize - 1} for your party of {partySize})</span>}
      </p>
      <form onSubmit={send} className={`flex flex-col sm:flex-row gap-2 mb-4 ${companions.length >= partySize - 1 ? 'opacity-40 pointer-events-none' : ''}`}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Companion name"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
        />
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 justify-center"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Send className="w-3.5 h-3.5" /> Send</>)}
        </button>
      </form>
      {companions.length > 0 ? (
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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                  <Icon className="w-3 h-3" /> {c.rsvp_status}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-body text-xs text-muted-foreground text-center py-2">{companions.length >= partySize - 1 ? 'All companion slots filled.' : 'No companions invited yet.'}</p>
      )}
    </div>
  );
}