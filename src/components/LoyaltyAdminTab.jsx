import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Crown, Users, Star, UserPlus, ChevronRight, Search } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white" /></div>
      <div>
        <p className="font-body text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

const TIER_COLORS = {
  "Regular": "#9ca3af",
  "Tap Member": "#cd7f32",
  "Reserve Member": "#94a3b8",
  "Founding Member": "#C89B4F",
};

function TierBadge({ tier }) {
  const color = TIER_COLORS[tier] || "#888";
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: color }}>
      {tier === "Founding Member" && <Crown className="w-3 h-3" />} {tier || "Regular"}
    </span>
  );
}

export default function LoyaltyAdminTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    const m = await base44.entities.TapRoomMember.list("-created_date", 200);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const filtered = members.filter(m => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.guest_name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.tier || "").toLowerCase().includes(q);
  });

  const totalPoints = members.reduce((sum, m) => sum + (m.points_balance || 0), 0);
  const foundingCount = members.filter(m => m.is_founding_member || m.tier === "Founding Member").length;
  const activeCount = members.filter(m => m.status === "Active").length;

  return (
    <div className="space-y-6">
      <Link to="/admin/referrals" className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-primary" />
          <div>
            <p className="font-body text-sm font-semibold">Referral Tracking Dashboard</p>
            <p className="font-body text-xs text-muted-foreground">See top referrers and recent member referrals</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary" />
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={members.length} color="bg-primary" />
        <StatCard icon={Star} label="Active" value={activeCount} color="bg-green-500" />
        <StatCard icon={Crown} label="Founding Members" value={foundingCount} color="bg-amber-500" />
        <StatCard icon={Star} label="Points in Circulation" value={totalPoints.toLocaleString()} color="bg-purple-500" />
      </div>

      <Link to="/admin/memberships" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium w-fit">
        <UserPlus className="w-4 h-4" /> Manage Memberships
      </Link>

      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email, or tier..."
          className="w-full sm:max-w-md pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(m => (
          <div key={m.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <p className="font-body font-semibold">{m.guest_name}</p>
                <TierBadge tier={m.tier} />
                {m.status !== "Active" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{m.status}</span>
                )}
              </div>
              <p className="font-body text-sm text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="font-body text-xs text-muted-foreground">🍽 {m.total_visits || 0} visits</span>
                <span className="font-body text-xs text-muted-foreground">💰 ${(m.total_spend || 0).toFixed(2)} lifetime</span>
                <span className="font-body text-xs text-muted-foreground">⭐ {m.points_balance || 0} pts</span>
                {m.referral_code && <span className="font-body text-xs text-muted-foreground">🎟 {m.referral_code}</span>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-muted-foreground">{query ? "No members match your search." : "No members yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}