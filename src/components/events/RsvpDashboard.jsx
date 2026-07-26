import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, HelpCircle, Clock } from "lucide-react";

const STATUS_CONFIG = {
  Attending: { icon: Check, color: "bg-green-100 text-green-700" },
  Declined: { icon: X, color: "bg-red-100 text-red-700" },
  Maybe: { icon: HelpCircle, color: "bg-amber-100 text-amber-700" },
  Pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
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
    totalParty: invites.filter((i) => i.rsvp_status === "Attending").reduce((sum, i) => sum + (i.party_size || 1), 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Invited" value={stats.total} color="bg-blue-50 text-blue-900" />
        <StatCard label="Attending" value={stats.attending.length} sub={`${stats.totalParty} guests`} color="bg-green-50 text-green-900" />
        <StatCard label="Maybe" value={stats.maybe.length} color="bg-amber-50 text-amber-900" />
        <StatCard label="Declined" value={stats.declined.length} color="bg-red-50 text-red-900" />
        <StatCard label="Pending" value={stats.pending.length} color="bg-muted text-foreground" />
      </div>

      {stats.totalParty > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
          <span className="font-body text-sm text-foreground"><strong className="font-heading">{stats.totalParty}</strong> confirmed guests attending out of <strong className="font-heading">{promotion.max_guests || "∞"}</strong> max</span>
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
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.rsvp_status] || STATUS_CONFIG.Pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-body text-sm font-medium">{inv.guest_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{inv.guest_email}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon className="w-3 h-3" /> {inv.rsvp_status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-body text-sm">{inv.rsvp_status === "Attending" ? `${inv.party_size || 1}` : "—"}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <p className="font-body text-xs text-muted-foreground max-w-xs truncate">{inv.dietary_notes || inv.plus_ones || "—"}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}