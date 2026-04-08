import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export default function SwapRequestModal({ shift, allShifts, onClose }) {
  const [targetShiftId, setTargetShiftId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Offer all other shifts that aren't the requester's own shift
  const otherShifts = allShifts.filter(s => s.id !== shift.id);

  const handleSubmit = async () => {
    if (!targetShiftId) { toast.error("Select a shift to swap with"); return; }
    const target = allShifts.find(s => s.id === targetShiftId);
    setLoading(true);
    await base44.entities.ShiftSwapRequest.create({
      requester_staff_id: shift.staff_id,
      requester_staff_name: shift.staff_name,
      requester_shift_id: shift.id,
      requester_shift_date: shift.date,
      requester_shift_block: shift.time_block,
      target_staff_id: target.staff_id,
      target_staff_name: target.staff_name,
      target_shift_id: target.id,
      target_shift_date: target.date,
      target_shift_block: target.time_block,
      reason,
      status: "Pending",
    });
    toast.success("Swap request submitted! A manager will review it shortly.");
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-lg font-semibold">Request Shift Swap</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* My shift */}
        <div className="bg-muted/40 border border-border rounded-xl p-4">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Shift</p>
          <p className="font-body text-sm font-semibold">{shift.staff_name}</p>
          <p className="font-body text-sm text-muted-foreground">{shift.date} · {shift.time_block}</p>
        </div>

        {/* Target shift */}
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Swap With *</label>
          <select
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={targetShiftId}
            onChange={e => setTargetShiftId(e.target.value)}
          >
            <option value="">— Select a shift —</option>
            {otherShifts.map(s => (
              <option key={s.id} value={s.id}>
                {s.staff_name} · {s.date} · {s.time_block}
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Reason (optional)</label>
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            placeholder="e.g. Doctor's appointment"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit Request"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}