import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, HelpCircle, Clock, Salad, Hourglass, ArrowUpCircle, Pencil, LogIn, CheckCheck } from "lucide-react";
import EventInviteEditModal from "./EventInviteEditModal";

const STATUS_CONFIG = {
  Attending: { icon: Check, color: "bg-green-100 text-green-700" },
  Declined: { icon: X, color: "bg-red-100 text-red-700" },
  Maybe: { icon: HelpCircle, color: "bg-amber-100 text-amber-700" },
  Pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
  Waitlisted: { icon: Hourglass, color: "bg-amber-100 text-amber-800" },
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="font-heading text-2xl font-bold">{value}</p>
      <p className="font-body text-xs opacity-80">{label}</p>
      {sub && <p className="font-body text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function RsvpDashboard({ promotion }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promotingId, setPromotingId] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.EventInvite.filter({ promotion_id: promotion.id })
      .then(setInvites)
      .finally(() => setLoading(false));
  }, [promotion.id]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: invites.length,
    attending: invites.filter((i) => i.rsvp_status === "Attending"),
    declined: invites.filter((i) => i.rsvp_status === "Declined"),
    maybe: invites.filter((i) => i.rsvp_status === "Maybe"),
    pending: invites.filter((i) => i.rsvp_status === "Pending"),
    waitlisted: invites.filter((i) => i.rsvp_status === "Waitlisted"),
    totalParty: invites.filter((i) => i.rsvp_status === "Attending").reduce((sum, i) => sum + (i.party_size || 1), 0),
    arrived: invites.filter((i) => i.rsvp_status === "Attending" && i.checked_in),
    arrivedParty: invites.filter((i) => i.rsvp_status === "Attending" && i.checked_in).reduce((sum, i) => sum + (i.party_size || 1), 0),
  };

  const promote = async (inv) => {
    if (!window.confirm(`Promote ${inv.guest_name} (party of ${inv.party_size || 1}) to Attending? They'll be emailed a confirmation automatically.`)) return;
    setPromotingId(inv.id);
    try {
      await base44.entities.EventInvite.update(inv.id, { rsvp_status: "Attending", rsvp_responded_at: new Date().toISOString() });
      load();
    } finally {
      setPromotingId(null);
    }
  };

  const toggleCheckIn = async (inv) => {
    const next = !inv.checked_in;
    setCheckingInId(inv.id);
    try {
      const patch = { checked_in: next };
      if (next) patch.checked_in_at = new Date().toISOString();
      await base44.entities.EventInvite.update(inv.id, patch);
      setInvites((prev) => prev.map((i) => (i.id === inv.id ? { ...i, checked_in: next, checked_in_at: patch.checked_in_at } : i)));
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Invited" value={stats.total} color="bg-blue-50 text-blue-900" />
        <StatCard label="Attending" value={stats.attending.length} sub={`${stats.totalParty} guests`} color="bg-green-50 text-green-900" />
        <StatCard label="Arrived" value={stats.arrived.length} sub={`${stats.arrivedParty} guests`} color="bg-emerald-100 text-emerald-900" />
        <StatCard label="Maybe" value={stats.maybe.length} color="bg-amber-50 text-amber-900" />
        <StatCard label="Declined" value={stats.declined.length} color="bg-red-50 text-red-900" />
        <StatCard label="Pending" value={stats.pending.length} color="bg-muted text-foreground" />
      </div>

      {stats.totalParty > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
          <span className="font-body text-sm text-foreground"><strong className="font-heading">{stats.totalParty}</strong> confirmed guests attending out of <strong className="font-heading">{promotion.max_guests || "∞"}</strong> max</span>
        </div>
      )}

      {stats.attending.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-body text-sm text-emerald-900">
            <strong className="font-heading">{stats.arrived.length}</strong> of <strong className="font-heading">{stats.attending.length}</strong> attending guests checked in. Use the <em>Check In</em> button in the list on the night of the event.
          </span>
        </div>
      )}

      {stats.waitlisted.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-body text-sm text-amber-900">
            <strong className="font-heading">{stats.waitlisted.length}</strong> on the waitlist. Guests are auto-promoted when others decline; you can also promote manually from the list below.
          </span>
        </div>
      )}

      {stats.attending.some((i) => i.dietary_notes) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-heading text-sm font-semibold text-amber-900 mb-2 flex items-center gap-1.5">
            <Salad className="w-4 h-4" /> Dietary Notes ({stats.attending.filter((i) => i.dietary_notes).length})
          </p>
          <ul className="space-y-1.5">
            {stats.attending.filter((i) => i.dietary_notes).map((i) => (
              <li key={i.id} className="font-body text-xs text-amber-800">
                <strong className="font-medium">{i.guest_name}:</strong> {i.dietary_notes}
                {i.checked_in ? <span className="ml-1 text-emerald-700 font-semibold">· arrived</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
        ) : invites.length === 0 ? (
          <p className="text-center py-8 font-body text-sm text-muted-foreground">No invitees yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5">Guest</th>
                  <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5">Status</th>
                  <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5">Party</th>
                  <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Dietary / Notes</th>
                  <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5">Checked In</th>
                  <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5">Edit</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.rsvp_status] || STATUS_CONFIG.Pending;
                  const Icon = cfg.icon;
                  const isAttending = inv.rsvp_status === "Attending";
                  return (
                    <tr key={inv.id} className={`border-b border-border last:border-0 ${inv.checked_in ? "bg-emerald-50/40" : ""}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-body text-sm font-medium">{inv.guest_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{inv.guest_email}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            <Icon className="w-3 h-3" /> {inv.rsvp_status}
                          </span>
                          {inv.rsvp_status === "Waitlisted" && (
                            <button
                              onClick={() => promote(inv)}
                              disabled={promotingId === inv.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              <ArrowUpCircle className="w-3 h-3" /> {promotingId === inv.id ? "…" : "Promote"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-body text-sm">{isAttending ? `${inv.party_size || 1}` : "—"}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <p className="font-body text-xs text-muted-foreground max-w-xs truncate">{inv.dietary_notes || inv.plus_ones || "—"}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        {isAttending ? (
                          <button
                            onClick={() => toggleCheckIn(inv)}
                            disabled={checkingInId === inv.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                              inv.checked_in
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-muted text-foreground hover:bg-emerald-100"
                            }`}
                            title={inv.checked_in ? `Arrived ${inv.checked_in_at ? new Date(inv.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}` : "Mark as arrived"}
                          >
                            <LogIn className="w-3 h-3" />
                            {checkingInId === inv.id ? "…" : inv.checked_in ? "Arrived" : "Check In"}
                          </button>
                        ) : (
                          <span className="font-body text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setEditing(inv)} className="p-1.5 hover:text-primary transition-colors" aria-label="Edit RSVP">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EventInviteEditModal
          invite={editing}
          promotion={promotion}
          onSaved={(updated) => {
            setInvites((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}