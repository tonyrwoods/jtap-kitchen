import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  LineChart, Line
} from "recharts";
import { Users, TrendingUp, Star, Clock, ChefHat, Filter } from "lucide-react";

const ROLES = ["All Roles", "Manager", "Chef", "Sous Chef", "Server", "Host", "Bartender", "Busser", "Dishwasher"];

const DATE_PRESETS = [
  { label: "Last 7 days",  days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time",     days: null },
];

function StatCard({ icon: Icon, label, value, sub, color = "bg-primary" }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-body text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-bold">{value}</p>
        {sub && <p className="font-body text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="font-heading text-base font-semibold mb-4">{children}</h2>;
}

// Build per-staff metrics from shifts & orders
function buildMetrics(staff, shifts, orders, dateFrom) {
  return staff.map(s => {
    const staffShifts = shifts.filter(sh =>
      sh.staff_id === s.id && (!dateFrom || sh.date >= dateFrom)
    );

    // Orders served by this staff member (matched by server_name as fallback)
    const staffOrders = orders.filter(o =>
      o.server_name?.toLowerCase() === s.name?.toLowerCase() &&
      (!dateFrom || (o.created_date && o.created_date.slice(0, 10) >= dateFrom))
    );

    const servedOrders = staffOrders.filter(o => o.status === "Served");
    const rushOrders   = staffOrders.filter(o => o.priority === "Rush");

    // Avg prep time: time from "New" to "Served" – we estimate from created_date vs updated_date on served orders
    const prepTimes = servedOrders
      .filter(o => o.created_date && o.updated_date)
      .map(o => (new Date(o.updated_date) - new Date(o.created_date)) / 60000); // minutes

    const avgPrepTime = prepTimes.length
      ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
      : null;

    return {
      id: s.id,
      name: s.name,
      role: s.role,
      color: s.color || "#C89B4F",
      totalShifts: staffShifts.length,
      totalOrders: staffOrders.length,
      servedOrders: servedOrders.length,
      rushOrders: rushOrders.length,
      avgPrepTime,
    };
  });
}

export default function StaffPerformance() {
  const [staff,  setStaff]  = useState([]);
  const [shifts, setShifts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter]     = useState("All Roles");
  const [datePreset, setDatePreset]     = useState(1); // index into DATE_PRESETS

  useEffect(() => {
    Promise.all([
      base44.entities.Staff.filter({ is_active: true }, "name", 200),
      base44.entities.Shift.list("-date", 1000),
      base44.entities.Order.list("-created_date", 1000),
    ]).then(([s, sh, o]) => { setStaff(s); setShifts(sh); setOrders(o); setLoading(false); });
  }, []);

  const dateFrom = useMemo(() => {
    const preset = DATE_PRESETS[datePreset];
    if (!preset.days) return null;
    const d = new Date();
    d.setDate(d.getDate() - preset.days);
    return d.toISOString().slice(0, 10);
  }, [datePreset]);

  const metrics = useMemo(() => {
    const filtered = roleFilter === "All Roles" ? staff : staff.filter(s => s.role === roleFilter);
    return buildMetrics(filtered, shifts, orders, dateFrom);
  }, [staff, shifts, orders, roleFilter, dateFrom]);

  // Summary stats
  const totalShifts  = metrics.reduce((s, m) => s + m.totalShifts, 0);
  const totalOrders  = metrics.reduce((s, m) => s + m.totalOrders, 0);
  const avgPrepTimes = metrics.filter(m => m.avgPrepTime !== null).map(m => m.avgPrepTime);
  const overallAvgPrep = avgPrepTimes.length
    ? Math.round(avgPrepTimes.reduce((a, b) => a + b, 0) / avgPrepTimes.length)
    : "—";

  // Chart data
  const ordersChartData = metrics
    .filter(m => m.totalOrders > 0)
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 12);

  const shiftsChartData = metrics
    .filter(m => m.totalShifts > 0)
    .sort((a, b) => b.totalShifts - a.totalShifts)
    .slice(0, 12);

  const prepTimeData = metrics
    .filter(m => m.avgPrepTime !== null)
    .sort((a, b) => a.avgPrepTime - b.avgPrepTime)
    .slice(0, 12);

  // Role distribution for radar
  const roleGroups = {};
  metrics.forEach(m => {
    if (!roleGroups[m.role]) roleGroups[m.role] = { role: m.role, orders: 0, shifts: 0, members: 0 };
    roleGroups[m.role].orders  += m.totalOrders;
    roleGroups[m.role].shifts  += m.totalShifts;
    roleGroups[m.role].members += 1;
  });
  const radarData = Object.values(roleGroups).map(r => ({
    role: r.role.split(" ")[0], // short label
    "Avg Orders": r.members ? Math.round(r.orders / r.members) : 0,
    "Avg Shifts": r.members ? Math.round(r.shifts / r.members) : 0,
  }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 lg:px-10 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Staff Performance</h1>
            <p className="font-body text-xs text-muted-foreground">Analytics &amp; metrics by employee</p>
          </div>
        </div>
        <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-8">

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-2xl">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors whitespace-nowrap
                  ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {DATE_PRESETS.map((p, i) => (
              <button key={p.label} onClick={() => setDatePreset(i)}
                className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors whitespace-nowrap
                  ${datePreset === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}    label="Staff Tracked"     value={metrics.length}       color="bg-blue-500" />
          <StatCard icon={ChefHat}  label="Shifts Worked"     value={totalShifts}          color="bg-primary" />
          <StatCard icon={TrendingUp} label="Orders Handled"  value={totalOrders}          color="bg-green-500" />
          <StatCard icon={Clock}    label="Avg Prep Time"      value={overallAvgPrep === "—" ? "—" : `${overallAvgPrep}m`} sub="per served order" color="bg-amber-500" />
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by staff */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionTitle>Orders Handled per Staff</SectionTitle>
            {ordersChartData.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-12">No order data matched to staff</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ordersChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Bar dataKey="servedOrders" name="Served" fill="hsl(var(--chart-2))" radius={[0,4,4,0]} />
                  <Bar dataKey="rushOrders"   name="Rush"   fill="hsl(var(--chart-5))" radius={[0,4,4,0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Shifts by staff */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionTitle>Shifts Worked per Staff</SectionTitle>
            {shiftsChartData.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-12">No shift data for selected filters</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={shiftsChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="totalShifts" name="Shifts" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avg Prep Time */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionTitle>Avg Order Prep Time (minutes)</SectionTitle>
            {prepTimeData.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-12">No prep time data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={prepTimeData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" unit="m" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={v => [`${v} min`, "Avg Prep Time"]} />
                  <Bar dataKey="avgPrepTime" name="Avg Prep Time" fill="hsl(var(--chart-4))" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Role Radar */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <SectionTitle>Role Comparison (Avg per Member)</SectionTitle>
            {radarData.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-12">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="role" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} />
                  <Radar name="Avg Orders" dataKey="Avg Orders" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
                  <Radar name="Avg Shifts" dataKey="Avg Shifts" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Staff Table ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <SectionTitle>Individual Breakdown</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {["Staff Member", "Role", "Shifts", "Orders", "Served", "Rush", "Avg Prep"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 font-body text-sm text-muted-foreground">No staff match the selected filters.</td></tr>
                ) : metrics.map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="font-body text-sm font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-muted-foreground">{m.role}</td>
                    <td className="px-5 py-3 font-heading text-sm font-semibold">{m.totalShifts}</td>
                    <td className="px-5 py-3 font-heading text-sm font-semibold">{m.totalOrders}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{m.servedOrders}</span>
                    </td>
                    <td className="px-5 py-3">
                      {m.rushOrders > 0
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">{m.rushOrders}</span>
                        : <span className="text-muted-foreground font-body text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 font-body text-sm">
                      {m.avgPrepTime !== null ? `${m.avgPrepTime}m` : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}