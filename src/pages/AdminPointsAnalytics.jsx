import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, TrendingUp, Star, AlertCircle, Users } from "lucide-react";

const GOLD = "#C89B4F";
const TIER_COLORS = { "Regular": "#9ca3af", "Tap Member": "#cd7f32", "Reserve Member": "#94a3b8", "Founding Member": GOLD };
const TYPE_COLORS = { Earn: "#22c55e", Redeem: "#ef4444", Bonus: "#6366f1", Expire: "#f59e0b", Adjustment: "#94a3b8", Welcome: GOLD };

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.15)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: GOLD }} />
        <span className="font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold" style={{ color: GOLD }}>{value}</p>
      {sub && <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>}
    </div>
  );
}

export default function AdminPointsAnalytics() {
  const [typeFilter, setTypeFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [searchMember, setSearchMember] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const { data: authUser } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });
  const { data: members = [] } = useQuery({
    queryKey: ["all-members"],
    queryFn: () => base44.entities.TapRoomMember.list("-created_date", 500),
    enabled: authUser?.role === "admin",
  });
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ["all-points-activity"],
    queryFn: () => base44.entities.PointsActivity.list("-transaction_date", 1000),
    enabled: authUser?.role === "admin",
  });

  const totalIssued = activity.filter(a => a.points > 0).reduce((s, a) => s + a.points, 0);
  const totalRedeemed = Math.abs(activity.filter(a => a.points < 0).reduce((s, a) => s + a.points, 0));
  const outstandingPoints = members.reduce((s, m) => s + (m.points_balance || 0), 0);
  const liability = (outstandingPoints * 0.005).toFixed(2);

  const tierData = ["Regular","Tap Member","Reserve Member","Founding Member"].map(t => ({
    name: t, value: members.filter(m => m.tier === t).length, color: TIER_COLORS[t]
  })).filter(t => t.value > 0);

  const top10 = [...members].sort((a,b) => (b.points_balance||0) - (a.points_balance||0)).slice(0,10);

  const bonusNightPoints = activity.filter(a => a.trigger === "bonus_night").reduce((s,a) => s + (a.points||0), 0);
  const otherPoints = activity.filter(a => a.trigger !== "bonus_night" && a.points > 0).reduce((s,a) => s + (a.points||0), 0);

  const filteredActivity = activity.filter(a => {
    const matchType = !typeFilter || a.transaction_type === typeFilter;
    const matchTrigger = !triggerFilter || a.trigger === triggerFilter;
    const matchMember = !searchMember || a.member_name?.toLowerCase().includes(searchMember.toLowerCase()) || a.member_email?.toLowerCase().includes(searchMember.toLowerCase());
    const matchFrom = !dateFrom || (a.transaction_date || "") >= dateFrom;
    const matchTo = !dateTo || (a.transaction_date || "") <= dateTo;
    return matchType && matchTrigger && matchMember && matchFrom && matchTo;
  });
  const sorted = [...filteredActivity].sort((a,b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  const paged = sorted.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const exportCSV = () => {
    const headers = ["Date","Member","Email","Type","Trigger","Points","Balance After","Description"];
    const rows = sorted.map(a => [a.transaction_date, a.member_name, a.member_email, a.transaction_type, a.trigger, a.points, a.balance_after, a.description]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v||""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "points_activity.csv"; a.click();
  };

  if (authUser?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
      <p className="font-heading text-2xl text-white">Admin access required</p>
    </div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#fff" }}>
      <div className="px-6 py-10" style={{ background: "#111", borderBottom: `1px solid ${GOLD}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: GOLD }}>Admin</p>
            <h1 className="font-heading text-3xl font-bold">Points &amp; Analytics</h1>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-body font-bold text-sm border"
            style={{ borderColor: GOLD, color: GOLD }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Points Issued" value={totalIssued.toLocaleString()} icon={Star} />
          <StatCard label="Total Redeemed" value={totalRedeemed.toLocaleString()} icon={TrendingUp} />
          <StatCard label="Outstanding Liability" value={`$${liability}`} sub={`${outstandingPoints.toLocaleString()} pts`} icon={AlertCircle} />
          <StatCard label="Total Members" value={members.length} icon={Users} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-7" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
            <p className="font-body text-xs uppercase tracking-widest mb-5" style={{ color: GOLD }}>Members by Tier</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tierData}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e1e1e", border: "none", color: "#fff" }} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {tierData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl p-7" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
            <p className="font-body text-xs uppercase tracking-widest mb-5" style={{ color: GOLD }}>Bonus Night Impact (Points Issued)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "Bonus Nights", points: bonusNightPoints },
                { name: "Regular Days", points: otherPoints },
              ]}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e1e1e", border: "none", color: "#fff" }} />
                <Bar dataKey="points" fill={GOLD} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP 10 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(200,155,79,0.15)" }}>
          <div className="px-7 py-5" style={{ background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-body text-xs uppercase tracking-widest" style={{ color: GOLD }}>Top 10 Members by Points Balance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ background: "#141414" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Rank","Name","Tier","Points Balance","Total Visits","Lifetime Spend"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top10.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-3 font-heading text-base font-bold" style={{ color: i === 0 ? GOLD : "rgba(255,255,255,0.4)" }}>#{i+1}</td>
                    <td className="px-5 py-3 font-body text-sm text-white">{m.guest_name}</td>
                    <td className="px-5 py-3">
                      <span className="font-body text-xs px-2 py-1 rounded-full"
                        style={{ background: `${TIER_COLORS[m.tier] || "#666"}20`, color: TIER_COLORS[m.tier] || "#666" }}>
                        {m.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-body text-sm font-bold" style={{ color: GOLD }}>{(m.points_balance||0).toLocaleString()}</td>
                    <td className="px-5 py-3 font-body text-sm text-white">{m.total_visits||0}</td>
                    <td className="px-5 py-3 font-body text-sm text-white">${(m.total_spend||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FILTERS + LOG */}
        <div className="flex flex-wrap gap-3 items-center">
          <input value={searchMember} onChange={e => { setSearchMember(e.target.value); setPage(1); }}
            placeholder="Search member..." className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none w-48"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <option value="">All Types</option>
            {["Earn","Redeem","Bonus","Expire","Adjustment","Welcome"].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={triggerFilter} onChange={e => { setTriggerFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <option value="">All Triggers</option>
            {["purchase","visit","birthday","referral","signup","review","bonus_night","bottle_order","admin_adjustment"].map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-7 py-5 flex items-center justify-between" style={{ background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-body text-xs uppercase tracking-widest" style={{ color: GOLD }}>Points Activity Log</p>
            <span className="font-body text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{filteredActivity.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ background: "#141414" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Date","Member","Type","Trigger","Points","Balance After","Description"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center font-body text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center font-body text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No records found</td></tr>
                ) : paged.map((a, i) => (
                  <tr key={a.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-3 font-body text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{a.transaction_date || "—"}</td>
                    <td className="px-5 py-3 font-body text-sm text-white whitespace-nowrap">{a.member_name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full font-body text-xs font-bold"
                        style={{ background: `${TYPE_COLORS[a.transaction_type] || "#666"}20`, color: TYPE_COLORS[a.transaction_type] || "#666" }}>
                        {a.transaction_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-body text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{a.trigger}</td>
                    <td className="px-5 py-3 font-body text-sm font-bold" style={{ color: a.points > 0 ? "#22c55e" : "#ef4444" }}>
                      {a.points > 0 ? "+" : ""}{a.points?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-body text-sm" style={{ color: GOLD }}>{a.balance_after?.toLocaleString() ?? "—"}</td>
                    <td className="px-5 py-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{a.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredActivity.length > PER_PAGE && (
            <div className="flex items-center justify-between px-7 py-4" style={{ background: "#111", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="font-body text-sm disabled:opacity-30" style={{ color: GOLD }}>← Prev</button>
              <span className="font-body text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Page {page} of {Math.ceil(filteredActivity.length / PER_PAGE)}</span>
              <button disabled={page * PER_PAGE >= filteredActivity.length} onClick={() => setPage(p => p+1)} className="font-body text-sm disabled:opacity-30" style={{ color: GOLD }}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}