import { useState, useEffect, useRef } from "react";
import SwapRequestModal from "../components/SwapRequestModal";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Plus, X, Users, Clock } from "lucide-react";
import { toast } from "sonner";

const TIME_BLOCKS = ["Breakfast (8am–11am)", "Lunch (11am–3pm)", "Dinner (5pm–9pm)", "Late Night (9pm–12am)", "Full Day"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ROLES = ["Manager", "Chef", "Sous Chef", "Server", "Host", "Bartender", "Busser", "Dishwasher"];

function getWeekDates(anchor) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function fmt(date) {
  return date.toISOString().slice(0, 10);
}

function ShiftChip({ shift, onRemove, onDragStart, onSwapRequest }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-white text-xs font-body font-medium cursor-grab active:cursor-grabbing select-none group"
      style={{ backgroundColor: shift.staff_color || "#C89B4F" }}
    >
      <span className="truncate">{shift.staff_name}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onSwapRequest(shift); }}
          title="Request swap"
          className="hover:bg-white/20 rounded p-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </button>
        <button onClick={() => onRemove(shift)} className="hover:bg-white/20 rounded p-0.5">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function Cell({ date, block, shifts, staff, onDrop, onRemove, onAdd, dragging, onSwapRequest }) {
  const [over, setOver] = useState(false);
  const cellShifts = shifts.filter(s => s.date === fmt(date) && s.time_block === block);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(fmt(date), block); }}
      className={`min-h-[80px] p-1.5 border-r border-b border-border transition-colors ${over ? "bg-primary/10" : "bg-background hover:bg-muted/30"}`}
    >
      <div className="space-y-1">
        {cellShifts.map(s => (
          <ShiftChip
          key={s.id}
          shift={s}
          onRemove={onRemove}
          onDragStart={() => dragging.current = s}
          onSwapRequest={onSwapRequest}
          />
        ))}
        <button
          onClick={() => onAdd(fmt(date), block)}
          className="w-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity py-0.5 rounded text-muted-foreground hover:text-primary"
          style={{ opacity: cellShifts.length === 0 ? 0.3 : undefined }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddShiftModal({ date, block, staff, onClose, onSave }) {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!selectedStaff) { toast.error("Select a staff member"); return; }
    const member = staff.find(s => s.id === selectedStaff);
    await base44.entities.Shift.create({
      staff_id: member.id,
      staff_name: member.name,
      staff_color: member.color || "#C89B4F",
      date,
      time_block: block,
      role: role || member.role,
      notes,
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Assign Shift</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="font-body text-sm text-muted-foreground">{date} · {block}</p>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Staff Member *</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
            <option value="">— Select —</option>
            {staff.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Override Role (optional)</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">— Use Default —</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Notes</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Cover for John" />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Assign Shift</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function StaffPanel({ staff, onAdd, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "Server", color: "#C89B4F", email: "", phone: "" });

  const handleSave = async (e) => {
    e.preventDefault();
    await base44.entities.Staff.create({ ...form, is_active: true });
    setShowForm(false);
    setForm({ name: "", role: "Server", color: "#C89B4F", email: "", phone: "" });
    onRefresh();
    toast.success("Staff member added!");
  };

  return (
    <div className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-semibold">Staff</h3>
          <button onClick={() => setShowForm(v => !v)} className="p-1 hover:text-primary transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSave} className="space-y-2">
            <input className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <select className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-7 border border-border rounded cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              <span className="font-body text-xs text-muted-foreground">Color</span>
            </div>
            <button type="submit" className="w-full py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-body font-medium">Add</button>
          </form>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {staff.map(s => (
          <div
            key={s.id}
            draggable
            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-grab hover:shadow-sm transition-shadow"
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color || "#C89B4F" }} />
            <div className="min-w-0">
              <p className="font-body text-xs font-medium truncate">{s.name}</p>
              <p className="font-body text-xs text-muted-foreground">{s.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffScheduler() {
  const [anchor, setAnchor] = useState(new Date());
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { date, block }
  const [swapModal, setSwapModal] = useState(null); // shift to swap
  const dragging = useRef(null);

  const weekDates = getWeekDates(anchor);

  const load = async () => {
    const [s, sh] = await Promise.all([
      base44.entities.Staff.filter({ is_active: true }, "name", 100),
      base44.entities.Shift.list("-created_date", 500),
    ]);
    setStaff(s);
    setShifts(sh);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const prevWeek = () => { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); };
  const nextWeek = () => { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); };
  const goToday = () => setAnchor(new Date());

  const handleDrop = async (date, block) => {
    const shift = dragging.current;
    if (!shift) return;
    dragging.current = null;
    if (shift.id) {
      // Move existing shift
      await base44.entities.Shift.update(shift.id, { date, time_block: block });
      setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, date, time_block: block } : s));
      toast.success("Shift moved!");
    }
  };

  const handleRemove = async (shift) => {
    await base44.entities.Shift.delete(shift.id);
    setShifts(prev => prev.filter(s => s.id !== shift.id));
    toast.success("Shift removed.");
  };

  const weekLabel = `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const weekShifts = shifts.filter(s => s.date >= fmt(weekDates[0]) && s.date <= fmt(weekDates[6]));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-xl font-bold">Staff Scheduler</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Drag shifts to reschedule · Click + to assign</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-full px-1 py-1">
            <button onClick={prevWeek} className="p-1.5 hover:text-primary transition-colors rounded-full hover:bg-background"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="px-3 py-1 font-body text-xs font-medium hover:text-primary transition-colors">{weekLabel}</button>
            <button onClick={nextWeek} className="p-1.5 hover:text-primary transition-colors rounded-full hover:bg-background"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Staff Sidebar */}
        <StaffPanel staff={staff} onRefresh={load} />

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full border-collapse table-fixed min-w-[700px]">
              <thead>
                <tr className="bg-card border-b border-border sticky top-0 z-10">
                  <th className="w-36 px-3 py-3 text-left border-r border-border">
                    <div className="flex items-center gap-1.5 font-body text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      <Clock className="w-3.5 h-3.5" /> Block
                    </div>
                  </th>
                  {weekDates.map((d, i) => {
                    const isToday = fmt(d) === fmt(new Date());
                    return (
                      <th key={i} className={`px-2 py-3 text-center border-r border-border font-body text-xs font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                        <div>{DAYS[i]}</div>
                        <div className={`text-lg font-heading font-bold ${isToday ? "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto" : ""}`}>
                          {d.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {TIME_BLOCKS.map(block => (
                  <tr key={block}>
                    <td className="px-3 py-2 border-r border-b border-border bg-card align-top">
                      <p className="font-body text-xs font-semibold text-foreground leading-tight">{block.split(" (")[0]}</p>
                      <p className="font-body text-xs text-muted-foreground">{block.match(/\((.+)\)/)?.[1]}</p>
                    </td>
                    {weekDates.map((d, i) => (
                      <Cell
                        key={i}
                        date={d}
                        block={block}
                        shifts={weekShifts}
                        staff={staff}
                        dragging={dragging}
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                        onAdd={(date, block) => setModal({ date, block })}
                        onSwapRequest={shift => setSwapModal(shift)}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-border bg-card px-6 py-3 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{staff.length} active staff</span>
        </div>
        <div className="font-body text-xs text-muted-foreground">
          {weekShifts.length} shifts this week
        </div>
        <div className="font-body text-xs text-muted-foreground">
          {TIME_BLOCKS.map(b => `${b.split(" (")[0]}: ${weekShifts.filter(s => s.time_block === b).length}`).join(" · ")}
        </div>
      </div>

      {modal && (
        <AddShiftModal
          date={modal.date}
          block={modal.block}
          staff={staff}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {swapModal && (
        <SwapRequestModal
          shift={swapModal}
          allShifts={shifts}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  );
}