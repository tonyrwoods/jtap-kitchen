import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CalendarDays, DollarSign, TrendingUp, CheckSquare } from "lucide-react";

const GOLD = "#C89B4F";
const STATUS_COLORS = {
  Inquiry: "#94a3b8", Tentative: "#f59e0b", Confirmed: "#22c55e", Completed: "#6366f1", Cancelled: "#ef4444"
};
const STATUS_FLOW = ["Inquiry","Tentative","Confirmed","Completed"];

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.15)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: GOLD }} />
        <span className="font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold" style={{ color: GOLD }}>{value}</p>
    </div>
  );
}

export default function AdminPrivateRoom() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const { data: authUser } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["all-rentals"],
    queryFn: () => base44.entities.PrivateRoomRental.list("-event_date", 500),
    enabled: authUser?.role === "admin",
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrivateRoomRental.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-rentals"] }),
  });

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  const filtered = bookings.filter(b => {
    const matchStatus = !statusFilter || b.status === statusFilter;
    const matchDay = !dayFilter || b.day_of_week === dayFilter;
    const matchMonth = !monthFilter || (b.event_date || "").startsWith(monthFilter);
    return matchStatus && matchDay && matchMonth;
  });

  const monthBookings = bookings.filter(b => (b.event_date || "").startsWith(thisMonth));
  const monthRevenue = monthBookings.filter(b => b.status !== "Cancelled").reduce((s, b) => s + (b.rental_rate || 0), 0);
  const totalFB = bookings.filter(b => b.status === "Completed").reduce((s, b) => s + (b.actual_fb_spend || 0), 0);
  const deposits = bookings.filter(b => b.deposit_paid).reduce((s, b) => s + (b.deposit_amount || 0), 0);
  const upcoming = bookings.filter(b => b.status === "Confirmed" && (b.event_date || "") >= new Date().toISOString().split("T")[0]).length;

  const advanceStatus = (b) => {
    const idx = STATUS_FLOW.indexOf(b.status);
    if (idx < STATUS_FLOW.length - 1) {
      updateBooking.mutate({ id: b.id, data: { status: STATUS_FLOW[idx + 1] } });
    }
  };

  if (authUser?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
      <p className="font-heading text-2xl text-white">Admin access required</p>
    </div>;
  }

  // Simple calendar
  const calYear = now.getFullYear();
  const calMonth = now.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });
  const bookedDatesMap = {};
  bookings.forEach(b => { if (b.event_date && b.status !== "Cancelled") bookedDatesMap[b.event_date] = b; });

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#fff" }}>
      <div className="px-6 py-10" style={{ background: "#111", borderBottom: `1px solid ${GOLD}30` }}>
        <div className="max-w-7xl mx-auto">
          <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: GOLD }}>Admin</p>
          <h1 className="font-heading text-3xl font-bold">Private Room Rentals</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="This Month Revenue" value={`$${monthRevenue.toLocaleString()}`} icon={DollarSign} />
          <StatCard label="Completed F&amp;B" value={`$${totalFB.toLocaleString()}`} icon={TrendingUp} />
          <StatCard label="Deposits Collected" value={`$${deposits.toLocaleString()}`} icon={CheckSquare} />
          <StatCard label="Upcoming Confirmed" value={upcoming} icon={CalendarDays} />
        </div>

        {/* CALENDAR */}
        <div className="rounded-2xl p-7" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
          <p className="font-body text-xs uppercase tracking-widest mb-5" style={{ color: GOLD }}>{monthName}</p>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-center font-body text-xs py-2" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dow = new Date(dateStr + "T12:00:00").getDay();
              const isAllowed = [0,1,2].includes(dow);
              const booking = bookedDatesMap[dateStr];
              return (
                <div key={day} className="rounded-lg p-1.5 text-center min-h-[44px] flex flex-col items-center justify-center"
                  style={{
                    background: booking ? `${STATUS_COLORS[booking.status] || GOLD}15` : isAllowed ? "rgba(255,255,255,0.03)" : "transparent",
                    border: booking ? `1px solid ${STATUS_COLORS[booking.status] || GOLD}50` : "1px solid transparent",
                  }}>
                  <span className="font-body text-xs" style={{ color: isAllowed ? (booking ? GOLD : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.2)" }}>{day}</span>
                  {booking && <span className="font-body text-[9px] mt-0.5" style={{ color: STATUS_COLORS[booking.status] }}>{booking.status}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            {[["Confirmed",GOLD],["Tentative","#f59e0b"],["Completed","#6366f1"],["Inquiry","#94a3b8"]].map(([s,c]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="font-body text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <option value="">All Status</option>
            {["Inquiry","Tentative","Confirmed","Completed","Cancelled"].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <option value="">All Days</option>
            {["Sunday","Monday","Tuesday"].map(o => <option key={o}>{o}</option>)}
          </select>
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
        </div>

        {/* TABLE */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ background: "#141414" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Date","Day","Member","Tier","Event","Guests","Rate","Deposit","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center font-body text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center font-body text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-body text-sm text-white">{b.event_date}</td>
                    <td className="px-4 py-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{b.day_of_week}</td>
                    <td className="px-4 py-3 font-body text-sm text-white whitespace-nowrap">{b.member_name}</td>
                    <td className="px-4 py-3 font-body text-xs" style={{ color: GOLD }}>{b.member_tier}</td>
                    <td className="px-4 py-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{b.event_type}</td>
                    <td className="px-4 py-3 font-body text-sm text-white">{b.guest_count}</td>
                    <td className="px-4 py-3 font-body text-sm" style={{ color: GOLD }}>{b.is_free_rental ? "FREE" : `$${b.rental_rate}`}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => updateBooking.mutate({ id: b.id, data: { deposit_paid: !b.deposit_paid } })}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: b.deposit_paid ? "#22c55e20" : "rgba(255,255,255,0.05)", color: b.deposit_paid ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
                        {b.deposit_paid ? "Paid" : "No"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full font-body text-xs font-bold"
                        style={{ background: `${STATUS_COLORS[b.status] || "#666"}20`, color: STATUS_COLORS[b.status] || "#666" }}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {b.status !== "Completed" && b.status !== "Cancelled" && (
                          <button onClick={() => advanceStatus(b)}
                            className="px-2.5 py-1 rounded-lg font-body text-xs font-bold"
                            style={{ background: `${GOLD}15`, color: GOLD }}>
                            Advance
                          </button>
                        )}
                        {b.status !== "Cancelled" && (
                          <button onClick={() => updateBooking.mutate({ id: b.id, data: { status: "Cancelled" } })}
                            className="px-2.5 py-1 rounded-lg font-body text-xs font-bold"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                            Cancel
                          </button>
                        )}
                      </div>
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