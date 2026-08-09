import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Users, Clock, Check, X, Calendar } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUSES = ["Pending", "Confirmed", "Cancelled", "Completed"];

const STATUS_STYLES = {
  Pending:   { chip: "bg-yellow-100 text-yellow-800 border-yellow-300",   dot: "bg-yellow-400" },
  Confirmed: { chip: "bg-green-100  text-green-800  border-green-300",    dot: "bg-green-500"  },
  Cancelled: { chip: "bg-red-100    text-red-800    border-red-300",      dot: "bg-red-400"    },
  Completed: { chip: "bg-blue-100   text-blue-800   border-blue-300",     dot: "bg-blue-400"   },
};

function fmt(date) { return date.toISOString().slice(0, 10); }
function startOfWeek(d) { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return x; }

// ── Occupancy badge (guests on a day) ────────────────────────────────────────
function OccupancyBar({ count, max }) {
  if (!count) return null;
  const pct = Math.min(count / max, 1);
  const color = pct > 0.75 ? "bg-red-400" : pct > 0.4 ? "bg-yellow-400" : "bg-green-400";
  return (
    <div className="w-full h-1 rounded-full bg-border mt-1">
      <div className={`h-1 rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

// ── Reservation chip ──────────────────────────────────────────────────────────
function Chip({ r, compact, onClick }) {
  const s = STATUS_STYLES[r.status] || STATUS_STYLES.Pending;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded px-1.5 py-0.5 text-xs font-body font-medium truncate hover:opacity-80 transition-opacity ${s.chip}`}
    >
      {compact
        ? <><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${s.dot}`} />{r.time} {r.guest_name}</>
        : `${r.time} · ${r.guest_name} · ${r.party_size} guests`
      }
    </button>
  );
}

// ── Detail sidebar panel ──────────────────────────────────────────────────────
function DetailPanel({ reservation, onClose, onUpdate }) {
  const [status, setStatus] = useState(reservation.status || "Pending");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(reservation.admin_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const save = async (newStatus) => {
    setSaving(true);
    await base44.entities.Reservation.update(reservation.id, { status: newStatus });
    onUpdate(reservation.id, newStatus);
    setStatus(newStatus);
    setSaving(false);
    toast.success("Status updated");
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.Reservation.update(reservation.id, { admin_notes: notes });
    setSavingNotes(false);
    toast.success("Notes saved");
  };

  const [editing, setEditing] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    guest_name: reservation.guest_name || "",
    email: reservation.email || "",
    phone: reservation.phone || "",
    date: reservation.date || "",
    time: reservation.time || "",
    party_size: reservation.party_size || 1,
    special_requests: reservation.special_requests || "",
  });

  const startEdit = () => {
    setEditForm({
      guest_name: reservation.guest_name || "",
      email: reservation.email || "",
      phone: reservation.phone || "",
      date: reservation.date || "",
      time: reservation.time || "",
      party_size: reservation.party_size || 1,
      special_requests: reservation.special_requests || "",
    });
    setEditing(true);
  };

  const saveDetails = async () => {
    if (!editForm.guest_name || !editForm.email || !editForm.date || !editForm.time || !editForm.party_size) {
      toast.error("Name, email, date, time, and party size are required.");
      return;
    }
    setSavingDetails(true);
    const payload = {
      guest_name: editForm.guest_name,
      email: editForm.email,
      phone: editForm.phone || null,
      date: editForm.date,
      time: editForm.time,
      party_size: parseInt(editForm.party_size) || 1,
      special_requests: editForm.special_requests || null,
    };
    await base44.entities.Reservation.update(reservation.id, payload);
    onUpdate(reservation.id, null, payload);
    setSavingDetails(false);
    setEditing(false);
    toast.success("Reservation updated");
  };

  const s = STATUS_STYLES[status] || STATUS_STYLES.Pending;

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-heading text-base font-semibold">Reservation</h3>
        <div className="flex items-center gap-1">
          {!editing && (
            <button onClick={startEdit} className="px-2 py-1 text-xs font-body text-primary hover:bg-primary/5 rounded-lg transition-colors">
              Edit
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-5 overflow-y-auto">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Guest Name *</label>
              <input value={editForm.guest_name} onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Email *</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Date *</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Time *</label>
                <input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} placeholder="7:00 PM" className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background" />
              </div>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Party Size *</label>
              <input type="number" min="1" value={editForm.party_size} onChange={(e) => setEditForm({ ...editForm, party_size: e.target.value })} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Special Requests</label>
              <textarea rows={2} value={editForm.special_requests} onChange={(e) => setEditForm({ ...editForm, special_requests: e.target.value })} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveDetails} disabled={savingDetails} className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50">
                {savingDetails ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="font-heading text-lg font-bold">{reservation.guest_name}</p>
              <p className="font-body text-sm text-muted-foreground">{reservation.email}</p>
              {reservation.phone && <p className="font-body text-sm text-muted-foreground">{reservation.phone}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-body text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{reservation.date} at {reservation.time}</span>
              </div>
              <div className="flex items-center gap-2 font-body text-sm">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{reservation.party_size} guest{reservation.party_size !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {reservation.special_requests && (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="font-body text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">Special Requests</p>
                <p className="font-body text-sm italic">{reservation.special_requests}</p>
              </div>
            )}
          </>
        )}

        <div>
          <p className="font-body text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wide">Admin Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes..."
            rows={2}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
          />
          <button onClick={saveNotes} disabled={savingNotes} className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50">
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>

        <div>
          <p className="font-body text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wide">Status</p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status}
          </span>
        </div>

        <div>
          <p className="font-body text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wide">Change Status</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.filter(st => st !== status).map(st => (
              <button
                key={st}
                onClick={() => save(st)}
                disabled={saving}
                className={`py-1.5 rounded-lg font-body text-xs font-medium border transition-all disabled:opacity-50 ${STATUS_STYLES[st].chip}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────
function MonthView({ current, reservations, onSelect, onDayClick }) {
  const sm = new Date(current.getFullYear(), current.getMonth(), 1);
  const firstDow = sm.getDay();
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDow + daysInMonth }, (_, i) =>
    i < firstDow ? null : new Date(current.getFullYear(), current.getMonth(), i - firstDow + 1)
  );
  while (cells.length % 7 !== 0) cells.push(null);

  // max guests on any day for occupancy bar scale
  const maxGuests = Math.max(1, ...cells.filter(Boolean).map(d =>
    reservations.filter(r => r.date === fmt(d) && r.status !== "Cancelled").reduce((s, r) => s + (r.party_size || 0), 0)
  ));

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 sticky top-0 z-10">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center">
            <p className="font-body text-xs text-muted-foreground uppercase font-semibold">{d}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="border-r border-b border-border min-h-[100px] bg-muted/10" />;
          const items = reservations.filter(r => r.date === fmt(d));
          const guests = items.filter(r => r.status !== "Cancelled").reduce((s, r) => s + (r.party_size || 0), 0);
          const isToday = fmt(d) === fmt(new Date());
          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              className={`border-r border-b border-border min-h-[100px] p-1.5 cursor-pointer hover:bg-muted/20 transition-colors ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <p className={`font-body text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {d.getDate()}
                </p>
                {items.length > 0 && (
                  <span className="font-body text-xs text-muted-foreground">{items.length}</span>
                )}
              </div>
              <OccupancyBar count={guests} max={maxGuests} />
              <div className="space-y-0.5 mt-1">
                {items.slice(0, 3).map(r => (
                  <Chip key={r.id} r={r} compact onClick={(e) => { e.stopPropagation(); onSelect(r); }} />
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
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ current, reservations, onSelect }) {
  const start = startOfWeek(current);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 sticky top-0 z-10">
        {days.map(d => {
          const isToday = fmt(d) === fmt(new Date());
          return (
            <div key={d} className={`p-3 text-center border-r last:border-0 border-border ${isToday ? "bg-primary/5" : ""}`}>
              <p className="font-body text-xs text-muted-foreground uppercase">{DAYS[d.getDay()]}</p>
              <p className={`font-heading text-lg font-semibold mt-0.5 ${isToday ? "text-primary" : ""}`}>{d.getDate()}</p>
              <p className="font-body text-xs text-muted-foreground">
                {reservations.filter(r => r.date === fmt(d)).length} res.
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map(d => {
          const items = reservations.filter(r => r.date === fmt(d)).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          const isToday = fmt(d) === fmt(new Date());
          return (
            <div key={d} className={`p-2 border-r last:border-0 border-border space-y-1 ${isToday ? "bg-primary/5" : ""}`}>
              {items.map(r => <Chip key={r.id} r={r} compact onClick={() => onSelect(r)} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({ current, reservations, onSelect }) {
  const items = reservations.filter(r => r.date === fmt(current)).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const totalGuests = items.filter(r => r.status !== "Cancelled").reduce((s, r) => s + (r.party_size || 0), 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl px-4 py-2.5 text-center">
          <p className="font-body text-xs text-muted-foreground">Reservations</p>
          <p className="font-heading text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-2.5 text-center">
          <p className="font-body text-xs text-muted-foreground">Total Guests</p>
          <p className="font-heading text-2xl font-bold">{totalGuests}</p>
        </div>
        {Object.entries(STATUS_STYLES).map(([st, sty]) => (
          <div key={st} className="bg-card border border-border rounded-xl px-3 py-2.5 text-center">
            <p className="font-body text-xs text-muted-foreground">{st}</p>
            <p className={`font-heading text-xl font-bold ${st === "Confirmed" ? "text-green-600" : st === "Pending" ? "text-yellow-600" : ""}`}>
              {items.filter(r => r.status === st).length}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No reservations this day.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {items.map(r => {
            const s = STATUS_STYLES[r.status] || STATUS_STYLES.Pending;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-full min-h-[2rem] rounded-full mt-1 ${s.dot}`} />
                  <div>
                    <p className="font-body font-semibold text-sm">{r.guest_name}</p>
                    <p className="font-body text-xs text-muted-foreground">{r.email}</p>
                    {r.special_requests && <p className="font-body text-xs text-muted-foreground italic mt-1 line-clamp-1">"{r.special_requests}"</p>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="font-body text-xs font-semibold">{r.time}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mb-1.5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="font-body text-xs">{r.party_size} guests</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {r.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
const VIEWS = ["Month", "Week", "Day"];

export default function ReservationsCalendarView({ reservations: initialReservations, loading }) {
  const [view, setView] = useState("Month");
  const [current, setCurrent] = useState(new Date());
  const [reservations, setReservations] = useState(initialReservations || []);
  const [selected, setSelected] = useState(null);

  useEffect(() => { setReservations(initialReservations || []); }, [initialReservations]);

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

  const handleUpdate = (id, newStatus, details) => {
    setReservations(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r };
      if (newStatus) updated.status = newStatus;
      if (details) Object.assign(updated, details);
      return updated;
    }));
    if (selected?.id === id) {
      setSelected(prev => {
        if (!prev || prev.id !== id) return prev;
        const updated = { ...prev };
        if (newStatus) updated.status = newStatus;
        if (details) Object.assign(updated, details);
        return updated;
      });
    }
  };

  const handleDayClick = (d) => {
    setCurrent(d);
    setView("Day");
  };

  // Summary stats
  const pending = reservations.filter(r => r.status === "Pending").length;
  const confirmed = reservations.filter(r => r.status === "Confirmed").length;
  const totalGuests = reservations.filter(r => r.status === "Confirmed").reduce((s, r) => s + (r.party_size || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Stats pills */}
          <span className="font-body text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1 rounded-full font-semibold">
            {pending} Pending
          </span>
          <span className="font-body text-xs bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-full font-semibold">
            {confirmed} Confirmed
          </span>
          <span className="font-body text-xs bg-muted text-muted-foreground border border-border px-3 py-1 rounded-full font-semibold">
            {totalGuests} confirmed guests
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading text-sm font-semibold min-w-[180px] text-center">{headerLabel()}</span>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrent(new Date())} className="ml-1 px-3 py-1.5 text-xs font-body border border-border rounded-lg hover:bg-muted transition-colors">
              Today
            </button>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md font-body text-xs font-medium transition-all ${view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar + Detail Panel */}
      <div className="flex flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === "Month" && (
              <MonthView current={current} reservations={reservations} onSelect={setSelected} onDayClick={handleDayClick} />
            )}
            {view === "Week" && (
              <WeekView current={current} reservations={reservations} onSelect={setSelected} />
            )}
            {view === "Day" && (
              <DayView current={current} reservations={reservations} onSelect={setSelected} />
            )}

            {selected && (
              <DetailPanel
                reservation={selected}
                onClose={() => setSelected(null)}
                onUpdate={handleUpdate}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}