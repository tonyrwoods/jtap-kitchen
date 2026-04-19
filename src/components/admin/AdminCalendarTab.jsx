import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, X, Edit2, Save } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-green-100 text-green-800 border-green-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
  Completed: "bg-blue-100 text-blue-800 border-blue-300",
};

function ReservationRow({ reservation, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(reservation);

  const handleSave = async () => {
    await base44.entities.Reservation.update(reservation.id, form);
    onUpdate();
    setEditing(false);
  };

  const handleStatusChange = async (status) => {
    await base44.entities.Reservation.update(reservation.id, { status });
    onUpdate();
  };

  if (editing) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={form.admin_notes || ""}
            onChange={e => setForm({ ...form, admin_notes: e.target.value })}
            placeholder="Internal notes..."
            className="col-span-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
            <Save className="w-3 h-3" /> Save
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-body font-semibold text-foreground">{form.guest_name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[form.status]}`}>
              {form.status}
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            {form.date} at {form.time} • {form.party_size} {form.party_size === 1 ? "guest" : "guests"}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">{form.email} • {form.phone}</p>
        </div>
        <div className="flex gap-2 sm:flex-col">
          <button
            onClick={() => handleStatusChange("Confirmed")}
            disabled={form.status === "Confirmed" || form.status === "Cancelled"}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-3 h-3" /> Confirm
          </button>
          <button
            onClick={() => handleStatusChange("Cancelled")}
            disabled={form.status === "Cancelled"}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>

      {form.special_requests && (
        <div className="mb-2 pb-2 border-t border-border pt-2">
          <p className="font-body text-xs text-muted-foreground"><span className="font-semibold">Guest Requests:</span> {form.special_requests}</p>
        </div>
      )}

      {form.admin_notes && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2">
          <p className="font-body text-xs text-foreground"><span className="font-semibold">Notes:</span> {form.admin_notes}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function AdminCalendarTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("list"); // list or calendar
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const data = await base44.entities.Reservation.list("-date", 200);
    setReservations(data);
    setLoading(false);
  };

  const startDate = startOfDay(currentDate);
  const endDate = addDays(startDate, 7);

  const upcomingReservations = reservations
    .filter(r => {
      const resDate = new Date(r.date);
      return resDate >= startDate && resDate < endDate;
    })
    .filter(r => statusFilter === "All" || r.status === statusFilter)
    .sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));

  const groupedByDate = upcomingReservations.reduce((acc, res) => {
    if (!acc[res.date]) acc[res.date] = [];
    acc[res.date].push(res);
    return acc;
  }, {});

  const dateLabels = Array.from({ length: 7 }, (_, i) => addDays(startDate, i)).map(d => d.toISOString().split("T")[0]);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-body font-semibold text-foreground min-w-32 text-center">
            {format(startDate, "MMM d")} – {format(addDays(endDate, -1), "MMM d, yyyy")}
          </span>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-2 px-3 py-1.5 border border-border rounded-lg font-body text-xs font-medium hover:bg-muted transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background font-body">
            {["All", "Pending", "Confirmed", "Cancelled", "Completed"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List View */}
      <div className="space-y-6">
        {dateLabels.map(date => {
          const dayReservations = groupedByDate[date] || [];
          return (
            <div key={date}>
              <div className="bg-muted/40 border-l-4 border-primary px-4 py-2 mb-3 rounded-sm">
                <p className="font-heading text-sm font-semibold text-foreground">{format(new Date(date), "EEEE, MMMM d, yyyy")}</p>
                <p className="font-body text-xs text-muted-foreground">{dayReservations.length} reservation{dayReservations.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="space-y-3">
                {dayReservations.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground italic">No reservations</p>
                ) : (
                  dayReservations.map(res => (
                    <ReservationRow key={res.id} reservation={res} onUpdate={fetchReservations} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {upcomingReservations.length === 0 && (
        <div className="text-center py-12">
          <p className="font-body text-muted-foreground">No reservations in this period.</p>
        </div>
      )}
    </motion.div>
  );
}