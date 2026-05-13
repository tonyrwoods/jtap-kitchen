import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame, CalendarDays, RefreshCw } from "lucide-react";

const TIME_SLOTS = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"
];
const MAX_TABLES = 10;
const TOTAL_SLOTS_PER_DAY = TIME_SLOTS.length * MAX_TABLES;

function getUpcomingWeekend() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const days = [];

  // Friday = 5, Saturday = 6, Sunday = 0
  const targets = [5, 6, 0];
  for (const target of targets) {
    let diff = target - day;
    if (diff <= 0) diff += 7;
    // If today IS that day and it's upcoming, include it
    if (day === target) diff = 0;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    days.push(d.toISOString().split("T")[0]);
  }

  // Deduplicate and sort
  return [...new Set(days)].sort();
}

function urgencyLabel(pct) {
  if (pct >= 0.85) return { text: "Almost Full", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" };
  if (pct >= 0.6)  return { text: "Filling Fast", color: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-500" };
  if (pct >= 0.3)  return { text: "Limited Spots", color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-400" };
  return           { text: "Good Availability", color: "text-green-600", bg: "bg-green-100", dot: "bg-green-500" };
}

const DAY_LABELS = { 5: "Friday", 6: "Saturday", 0: "Sunday" };

function getDayName(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_LABELS[d.getDay()] ?? d.toLocaleDateString("en-US", { weekday: "long" });
}

function getShortDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WeekendAvailability({ onBook }) {
  const [data, setData] = useState(null); // { [date]: bookedCount }
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const weekendDates = getUpcomingWeekend();

  const fetchData = async () => {
    setLoading(true);
    const results = await Promise.all(
      weekendDates.map(date =>
        base44.entities.Reservation.filter({ date })
          .then(res => ({ date, count: res.filter(r => r.status !== "Cancelled").length }))
      )
    );
    const map = {};
    results.forEach(({ date, count }) => { map[date] = count; });
    setData(map);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const totalBooked = data ? Object.values(data).reduce((a, b) => a + b, 0) : 0;
  const totalCapacity = TOTAL_SLOTS_PER_DAY * weekendDates.length;
  const overallPct = totalCapacity > 0 ? totalBooked / totalCapacity : 0;
  const overallUrgency = urgencyLabel(overallPct);
  const totalAvailable = totalCapacity - totalBooked;

  return (
    <section className="bg-foreground text-background py-6 px-6 border-b border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Left: headline */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-body ${overallUrgency.bg} ${overallUrgency.color}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${overallUrgency.dot}`} />
              {loading ? "Checking..." : overallUrgency.text}
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-white">
                {loading
                  ? "Loading weekend availability..."
                  : `${totalAvailable} table slot${totalAvailable !== 1 ? "s" : ""} left this weekend`}
              </p>
              {lastUpdated && (
                <p className="font-body text-xs text-white/40">
                  Live · updated {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>

          {/* Right: per-day pills + CTA */}
          <div className="flex flex-wrap items-center gap-2">
            {weekendDates.map(date => {
              const booked = data?.[date] ?? 0;
              const avail = TOTAL_SLOTS_PER_DAY - booked;
              const pct = booked / TOTAL_SLOTS_PER_DAY;
              const u = urgencyLabel(pct);
              return (
                <motion.button
                  key={date}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => onBook && onBook({ date })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <div className="text-left">
                    <p className="font-body text-xs font-semibold text-white leading-tight">{getDayName(date)}</p>
                    <p className={`font-body text-xs ${u.color} leading-tight`}>
                      {loading ? "—" : `${avail} left`}
                    </p>
                  </div>
                </motion.button>
              );
            })}

            <button
              onClick={() => onBook && onBook({})}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5" /> Reserve Now
            </button>

            <button onClick={fetchData} title="Refresh"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mini bar chart */}
        {!loading && data && (
          <div className="flex gap-3 mt-4">
            {weekendDates.map(date => {
              const booked = data[date] ?? 0;
              const pct = booked / TOTAL_SLOTS_PER_DAY;
              const u = urgencyLabel(pct);
              return (
                <div key={date} className="flex-1">
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        pct >= 0.85 ? "bg-red-500" :
                        pct >= 0.6  ? "bg-orange-400" :
                        pct >= 0.3  ? "bg-amber-400" : "bg-green-400"
                      }`}
                    />
                  </div>
                  <p className="font-body text-xs text-white/30 mt-1 text-center">{getShortDate(date)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}