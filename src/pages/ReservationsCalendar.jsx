import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import ReservationDetailModal from "../components/ReservationDetailModal";

const VIEWS = ["Day", "Week", "Month"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_COLORS = {
  Pending: "bg-yellow-200 text-yellow-900 border-yellow-300",
  Confirmed: "bg-green-200 text-green-900 border-green-300",
  Cancelled: "bg-red-200 text-red-900 border-red-300",
  Completed: "bg-blue-200 text-blue-900 border-blue-300",
};

function fmt(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function ReservationsCalendar() {
  const [view, setView] = useState("Month");
  const [current, setCurrent] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.Reservation.list("-date", 500).then(r => {
      setReservations(r);
      setLoading(false);
    });
  }, []);

  const resOnDay = (dateStr) =>
    reservations.filter(r => r.date === dateStr);

  // Navigation
  const navigate = (dir) => {
    const d = new Date(current);
    if (view === "Day") d.setDate(d.getDate() + dir);
    else if (view === "Week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrent(d);
  };

  const headerLabel = () => {
    if (view === "Day") return current.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (view === "Week") {
      const start = startOfWeek(current);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // --- DAY VIEW ---
  const DayView = () => {
    const dateStr = fmt(current);
    const items = resOnDay(dateStr);
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="font-body text-sm text-muted-foreground mb-4">{items.length} reservation{items.length !== 1 ? "s" : ""}</p>
        {items.length === 0 && <p className="font-body text-muted-foreground text-center py-16">No reservations this day.</p>}
        <div className="space-y-3">
          {items.sort((a, b) => a.time?.localeCompare(b.time)).map(r => (
            <ReservationChip key={r.id} r={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      </div>
    );
  };

  // --- WEEK VIEW ---
  const WeekView = () => {
    const start = startOfWeek(current);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {days.map(d => (
            <div key={d} className={`p-3 text-center border-r last:border-0 border-border ${fmt(d) === fmt(new Date()) ? "bg-primary/5" : ""}`}>
              <p className="font-body text-xs text-muted-foreground uppercase">{DAYS[d.getDay()]}</p>
              <p className={`font-heading text-lg font-semibold mt-0.5 ${fmt(d) === fmt(new Date()) ? "text-primary" : ""}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[300px]">
          {days.map(d => {
            const items = resOnDay(fmt(d));
            return (
              <div key={d} className={`p-2 border-r last:border-0 border-border space-y-1 ${fmt(d) === fmt(new Date()) ? "bg-primary/5" : ""}`}>
                {items.sort((a, b) => a.time?.localeCompare(b.time)).map(r => (
                  <ReservationChip key={r.id} r={r} compact onClick={() => setSelected(r)} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- MONTH VIEW ---
  const MonthView = () => {
    const start = startOfMonth(current);
    const firstDow = start.getDay();
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: firstDow + daysInMonth }, (_, i) => {
      if (i < firstDow) return null;
      const d = new Date(current.getFullYear(), current.getMonth(), i - firstDow + 1);
      return d;
    });
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center">
              <p className="font-body text-xs text-muted-foreground uppercase font-semibold">{d}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="border-r border-b border-border min-h-[90px] bg-muted/20" />;
            const items = resOnDay(fmt(d));
            const isToday = fmt(d) === fmt(new Date());
            return (
              <div key={i} className={`border-r border-b border-border min-h-[90px] p-1.5 ${isToday ? "bg-primary/5" : ""}`}>
                <p className={`font-body text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {d.getDate()}
                </p>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map(r => (
                    <ReservationChip key={r.id} r={r} compact onClick={() => setSelected(r)} />
                  ))}
                  {items.length > 3 && (
                    <p className="font-body text-xs text-muted-foreground pl-1">+{items.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 lg:px-10 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Reservations Calendar</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">{reservations.length} total bookings</p>
          </div>
          <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin Dashboard</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading text-base font-semibold min-w-[200px] text-center">{headerLabel()}</span>
            <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrent(new Date())} className="ml-2 px-4 py-2 text-xs font-body border border-border rounded-lg hover:bg-muted transition-colors">
              Today
            </button>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md font-body text-sm font-medium transition-all ${view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {view === "Day" && <DayView />}
            {view === "Week" && <WeekView />}
            {view === "Month" && <MonthView />}
          </motion.div>
        )}
      </div>

      {selected && <ReservationDetailModal reservation={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ReservationChip({ r, compact, onClick }) {
  const color = STATUS_COLORS[r.status] || "bg-muted text-muted-foreground border-border";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded px-1.5 py-0.5 text-xs font-body font-medium truncate hover:opacity-80 transition-opacity ${color}`}
    >
      {compact ? `${r.time} ${r.guest_name}` : `${r.time} · ${r.guest_name} · ${r.party_size} guests`}
    </button>
  );
}