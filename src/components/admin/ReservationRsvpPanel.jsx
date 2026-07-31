import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Clock, Users } from "lucide-react";

const STATUS = {
  Attending: { icon: Check, color: "bg-green-100 text-green-700" },
  Declined: { icon: X, color: "bg-red-100 text-red-700" },
  Pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
};

function fmt(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function ReservationRsvpPanel({ reservation }) {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ReservationInvite.filter({ reservation_id: reservation.id })
      .then(setCompanions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reservation.id]);

  const confirmed = !!reservation.confirmed_at;
  const declined = !!reservation.declined_at;
  const attending = companions.filter((c) => c.rsvp_status === "Attending").length;

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {confirmed && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium"><Check className="w-3 h-3" /> Confirmed by guest · {fmt(reservation.confirmed_at)}</span>}
        {declined && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium"><X className="w-3 h-3" /> Declined by guest · {fmt(reservation.declined_at)}</span>}
        {!confirmed && !declined && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium"><Clock className="w-3 h-3" /> Awaiting guest confirmation</span>}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium"><Users className="w-3 h-3" /> {companions.length} invited · {attending} attending</span>
      </div>
      {loading ? (
        <p className="font-body text-xs text-muted-foreground">Loading companions…</p>
      ) : companions.length > 0 ? (
        <div className="space-y-1">
          {companions.map((c) => {
            const cfg = STATUS[c.rsvp_status] || STATUS.Pending;
            const Icon = cfg.icon;
            return (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
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
        <p className="font-body text-xs text-muted-foreground">No companion invites sent.</p>
      )}
    </div>
  );
}