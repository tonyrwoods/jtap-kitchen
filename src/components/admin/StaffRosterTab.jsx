import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

const TIME_BLOCKS = ["Breakfast (8am–11am)", "Lunch (11am–3pm)", "Dinner (5pm–9pm)", "Late Night (9pm–12am)", "Full Day"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function fmt(date) {
  return date.toISOString().slice(0, 10);
}

// ── Staff list management ──────────────────────────────────────────────────
function StaffListPanel({ staff, loading, onAdd, onToggle, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Server");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await onAdd({ name: newName, role: newRole, is_active: true });
    setNewName("");
  };

  const ROLES = ["Manager", "Chef", "Sous Chef", "Server", "Host", "Bartender", "Busser", "Dishwasher"];
  const active = staff.filter(s => s.is_active);
  const inactive = staff.filter(s => !s.is_active);

  return (
    <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-heading text-base font-semibold">Staff Members</h3>
        <p className="font-body text-xs text-muted-foreground mt-1">{active.length} active</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Active Staff */}
        {active.length > 0 && (
          <div>
            <p className="font-body text-xs text-muted-foreground uppercase font-semibold mb-2">Active</p>
            <div className="space-y-1.5">
              {active.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group">
                  <div className="w-2 h-6 rounded-full shrink-0" style={{ backgroundColor: s.color || "#C89B4F" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-semibold truncate">{s.name}</p>
                    <p className="font-body text-xs text-muted-foreground truncate">{s.role}</p>
                  </div>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Staff */}
        {inactive.length > 0 && (
          <div>
            <p className="font-body text-xs text-muted-foreground uppercase font-semibold mb-2">Inactive</p>
            <div className="space-y-1.5">
              {inactive.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 bg-muted/10 rounded-lg opacity-60 group">
                  <div className="w-2 h-6 rounded-full shrink-0" style={{ backgroundColor: s.color || "#C89B4F" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-semibold truncate">{s.name}</p>
                    <p className="font-body text-xs text-muted-foreground truncate">{s.role}</p>
                  </div>
                  <button
                    onClick={() => onToggle(s.id, true)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-green-100 hover:text-green-700 rounded transition-all"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="font-body text-xs text-muted-foreground text-center py-4">Loading...</p>}
      </div>

      {/* Add Staff Form */}
      <div className="border-t border-border p-4 space-y-3">
        <form onSubmit={handleAdd} className="space-y-2">
          <input
            type="text"
            placeholder="Staff name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background font-body"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background font-body"
          >
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground rounded-lg font-body text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" /> Add Staff
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Shift edit modal ───────────────────────────────────────────────────────
function ShiftModal({ date, staffList, onSave, onClose }) {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("Dinner (5pm–9pm)");
  const [role, setRole] = useState("");

  const handleSave = async () => {
    if (!selectedStaff || !selectedBlock) return;
    const staff = staffList.find(s => s.id === selectedStaff);
    await onSave({
      staff_id: selectedStaff,
      staff_name: staff?.name,
      staff_color: staff?.color,
      date: fmt(date),
      time_block: selectedBlock,
      role: role || staff?.role || ""
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h3 className="font-heading text-lg font-bold mb-4">Assign Shift</h3>
        
        <div className="space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">Date</label>
            <p className="font-body font-semibold">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">Staff Member</label>
            <select
              value={selectedStaff}
              onChange={e => {
                const s = staffList.find(st => st.id === e.target.value);
                setSelectedStaff(e.target.value);
                setRole(s?.role || "");
              }}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              <option value="">Select a staff member</option>
              {staffList.filter(s => s.is_active).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">Time Block</label>
            <select
              value={selectedBlock}
              onChange={e => setSelectedBlock(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              {TIME_BLOCKS.map(b => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">Role (Optional)</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              placeholder="e.g., Floor Manager"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg font-body text-sm font-semibold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStaff}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Weekly roster grid ─────────────────────────────────────────────────────
function WeeklyRoster({ week, shifts, staffMap, onAddShift, onDeleteShift }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getShiftsForDay = (dateStr) =>
    shifts.filter(s => s.date === dateStr).sort((a, b) => TIME_BLOCKS.indexOf(a.time_block) - TIME_BLOCKS.indexOf(b.time_block));

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 sticky top-0 z-10">
        {days.map(d => {
          const isToday = fmt(d) === fmt(new Date());
          return (
            <div key={d} className={`p-3 text-center border-r last:border-0 border-border ${isToday ? "bg-primary/5" : ""}`}>
              <p className="font-body text-xs text-muted-foreground uppercase font-semibold">{DAYS[d.getDay()]}</p>
              <p className={`font-heading text-lg font-bold mt-1 ${isToday ? "text-primary" : ""}`}>{d.getDate()}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{d.toLocaleDateString("en-US", { month: "short" })}</p>
            </div>
          );
        })}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 min-h-[600px]">
        {days.map(d => {
          const dateStr = fmt(d);
          const dayShifts = getShiftsForDay(dateStr);
          const isToday = dateStr === fmt(new Date());

          return (
            <div key={d} className={`border-r last:border-0 border-border p-2 space-y-1.5 ${isToday ? "bg-primary/5" : ""}`}>
              {/* Add shift button */}
              <button
                onClick={() => onAddShift(d)}
                className="w-full py-1.5 text-xs border border-dashed border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground font-body"
              >
                + Shift
              </button>

              {/* Shifts */}
              {dayShifts.map(shift => {
                const staff = staffMap[shift.staff_id];
                return (
                  <div
                    key={shift.id}
                    className="group relative bg-card border border-border rounded-lg p-2 hover:shadow-md transition-all"
                    style={{ borderLeftColor: shift.staff_color || "#C89B4F", borderLeftWidth: "3px" }}
                  >
                    <p className="font-body text-xs font-bold leading-tight truncate">{shift.staff_name}</p>
                    <p className="font-body text-xs text-muted-foreground leading-tight truncate">{shift.time_block}</p>
                    <button
                      onClick={() => onDeleteShift(shift.id)}
                      className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function StaffRosterTab() {
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shiftModal, setShiftModal] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Staff.list("-created_date", 100),
      base44.entities.Shift.list("-date", 500),
    ]).then(([s, sh]) => {
      setStaff(s);
      setShifts(sh);
      setLoading(false);
    });
  }, []);

  const staffMap = Object.fromEntries(staff.map(s => [s.id, s]));

  const addStaff = async (data) => {
    const newStaff = await base44.entities.Staff.create(data);
    setStaff(prev => [...prev, newStaff]);
    toast.success("Staff member added");
  };

  const toggleStaffActive = async (id, active) => {
    await base44.entities.Staff.update(id, { is_active: active });
    setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
  };

  const deleteStaff = async (id) => {
    await base44.entities.Staff.delete(id);
    setStaff(prev => prev.filter(s => s.id !== id));
    toast.success("Staff member removed");
  };

  const addShift = async (data) => {
    const newShift = await base44.entities.Shift.create(data);
    setShifts(prev => [...prev, newShift]);
    setShiftModal(null);
    toast.success("Shift assigned");
  };

  const deleteShift = async (id) => {
    await base44.entities.Shift.delete(id);
    setShifts(prev => prev.filter(s => s.id !== id));
    toast.success("Shift removed");
  };

  const navigate = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="font-heading text-sm font-semibold">
              {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
              {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="font-body text-xs text-muted-foreground">Week {Math.ceil((weekStart.getDate() + 6) / 7)}</p>
          </div>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="ml-2 px-3 py-1.5 text-xs font-body border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Today
          </button>
        </div>

        <div className="font-body text-xs text-muted-foreground">
          {shifts.filter(s => {
            const d = new Date(s.date);
            return d >= weekStart && d <= weekEnd;
          }).length} shifts this week
        </div>
      </div>

      {/* Layout: Staff panel + Roster grid */}
      <div className="flex flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <StaffListPanel
              staff={staff}
              loading={loading}
              onAdd={addStaff}
              onToggle={toggleStaffActive}
              onDelete={deleteStaff}
            />
            <WeeklyRoster
              week={weekStart}
              shifts={shifts}
              staffMap={staffMap}
              onAddShift={d => setShiftModal(d)}
              onDeleteShift={deleteShift}
            />
          </>
        )}
      </div>

      {/* Modal */}
      {shiftModal && (
        <ShiftModal
          date={shiftModal}
          staffList={staff}
          onSave={addShift}
          onClose={() => setShiftModal(null)}
        />
      )}
    </div>
  );
}