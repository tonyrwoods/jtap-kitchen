import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, CalendarCheck, Users } from "lucide-react";

// Weekly marketing KPIs surfaced on the admin Overview, measured against the
// low-band targets from the marketing plan. Counts come from the server
// (Reservation / EventInvite count calls) — no records are loaded into JS.

const TARGETS = { reservations: 8, rsvps: 6 };

export default function MarketingKpiSnapshot() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const iso = since.toISOString();
    Promise.all([
      base44.entities.Reservation.count({ created_date: { $gte: iso }, status: { $ne: "Cancelled" } }),
      base44.entities.EventInvite.count({ rsvp_status: "Attending", created_date: { $gte: iso } }),
    ])
      .then(([reservations, rsvps]) => setData({ reservations, rsvps }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Weekly Reservations", value: data?.reservations ?? 0, target: TARGETS.reservations, icon: CalendarCheck, color: "bg-blue-500" },
    { label: "Weekly Event RSVPs", value: data?.rsvps ?? 0, target: TARGETS.rsvps, icon: Users, color: "bg-purple-500" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-lg font-semibold">Marketing KPIs — This Week</h3>
        <span className="font-body text-xs text-muted-foreground ml-auto">vs. target</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {kpis.map((k) => {
          const pct = k.target > 0 ? Math.min(100, (k.value / k.target) * 100) : 0;
          const Icon = k.icon;
          return (
            <div key={k.label} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${k.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-body text-xs text-muted-foreground">{k.label}</p>
                  <p className="font-heading text-2xl font-bold text-foreground">
                    {loading ? "—" : k.value}
                    <span className="font-body text-sm font-normal text-muted-foreground"> / {k.target}</span>
                  </p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}