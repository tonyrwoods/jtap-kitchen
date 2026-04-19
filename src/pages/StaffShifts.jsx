import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Calendar, Clock, User, Send, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

function SwapRequestModal({ shift, staff, allShifts, onSubmit, onClose }) {
  const [targetStaffId, setTargetStaffId] = useState("");
  const [targetShiftId, setTargetShiftId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const targetStaff = staff.find(s => s.id === targetStaffId);
  const targetShifts = targetStaffId
    ? allShifts.filter(s => s.staff_id === targetStaffId && s.date === shift.date)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetStaffId || !targetShiftId || !reason.trim()) return;

    const targetShift = allShifts.find(s => s.id === targetShiftId);
    setSubmitting(true);

    await onSubmit({
      requester_staff_id: shift.staff_id,
      requester_staff_name: shift.staff_name,
      requester_shift_id: shift.id,
      requester_shift_date: shift.date,
      requester_shift_block: shift.time_block,
      target_staff_id: targetStaffId,
      target_staff_name: targetStaff?.name,
      target_shift_id: targetShiftId,
      target_shift_date: targetShift?.date,
      target_shift_block: targetShift?.time_block,
      reason: reason.trim(),
      status: "Pending",
    });

    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <h3 className="font-heading text-lg font-bold mb-4">Request Shift Swap</h3>

        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Your Shift:</p>
          <p className="font-body font-semibold">{shift.time_block}</p>
          <p className="font-body text-xs text-muted-foreground">{new Date(shift.date).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
              Swap With
            </label>
            <select
              value={targetStaffId}
              onChange={e => {
                setTargetStaffId(e.target.value);
                setTargetShiftId("");
              }}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              <option value="">Select staff member</option>
              {staff.filter(s => s.is_active && s.id !== shift.staff_id).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {targetShifts.length > 0 && (
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
                Their Shift
              </label>
              <select
                value={targetShiftId}
                onChange={e => setTargetShiftId(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              >
                <option value="">Select their shift</option>
                {targetShifts.map(s => (
                  <option key={s.id} value={s.id}>{s.time_block}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none"
              rows={3}
              placeholder="Why do you need this swap?"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg font-body text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !targetStaffId || !targetShiftId || !reason.trim()}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffShifts() {
  const { user } = useAuth();
  const [myShifts, setMyShifts] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swapModal, setSwapModal] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const currentY = e.touches[0].clientY;
    const scrollTop = containerRef.current.scrollTop;

    if (scrollTop === 0 && currentY > startY.current && currentY - startY.current > 50) {
      setIsRefreshing(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (user?.email) {
      const [shifts, staffList, swapRequests] = await Promise.all([
        base44.entities.Shift.list("-date", 500),
        base44.entities.Staff.list("-created_date", 100),
        base44.entities.ShiftSwapRequest.list("-created_date", 100),
      ]);
      const currentStaff = staffList.find(s => s.email === user.email);
      if (currentStaff) {
        setMyShifts(shifts.filter(s => s.staff_id === currentStaff.id).sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
      setRequests(swapRequests.filter(r => r.requester_staff_id === currentStaff?.id || r.target_staff_id === currentStaff?.id));
    }
    setIsRefreshing(false);
    toast.success("Refreshed!");
  };

  useEffect(() => {
    if (!user?.email) return;

    Promise.all([
      base44.entities.Shift.list("-date", 500),
      base44.entities.Staff.list("-created_date", 100),
      base44.entities.ShiftSwapRequest.list("-created_date", 100),
    ]).then(([shifts, staffList, swapRequests]) => {
      // Find the staff member matching current user's email
      const currentStaff = staffList.find(s => s.email === user.email);
      
      if (currentStaff) {
        const myShiftsList = shifts.filter(s => s.staff_id === currentStaff.id);
        setMyShifts(myShiftsList.sort((a, b) => new Date(a.date) - new Date(b.date)));
      }

      setAllShifts(shifts);
      setStaff(staffList);
      setRequests(swapRequests.filter(r => r.requester_staff_id === currentStaff?.id || r.target_staff_id === currentStaff?.id));
      setLoading(false);
    });
  }, [user?.email]);

  const submitSwapRequest = async (data) => {
    await base44.entities.ShiftSwapRequest.create(data);
    setRequests(prev => [...prev, data]);
    toast.success("Swap request sent for manager approval");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Not Authenticated</h2>
          <p className="font-body text-muted-foreground">Please log in to view your shifts.</p>
        </div>
      </div>
    );
  }

  const currentStaff = staff.find(s => s.email === user.email);

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="min-h-screen bg-background py-20 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold mb-2">My Shifts</h1>
            <p className="font-body text-muted-foreground">
              {currentStaff ? `Welcome, ${currentStaff.name}` : "View your scheduled shifts"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : myShifts.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-muted-foreground">No shifts scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Requests */}
            {requests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                <p className="font-body text-sm font-semibold text-blue-900 mb-2">
                  {requests.length} pending swap request(s)
                </p>
                <div className="space-y-2">
                  {requests.map(req => (
                    <div key={req.id} className="text-xs font-body text-blue-800">
                      {req.requester_staff_id === currentStaff?.id ? (
                        <>Requested to swap with {req.target_staff_name} — Status: <span className="font-semibold uppercase">{req.status}</span></>
                      ) : (
                        <>{req.requester_staff_name} requested to swap with you — Status: <span className="font-semibold uppercase">{req.status}</span></>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shifts */}
            <div className="space-y-3">
              {myShifts.map(shift => {
                const shiftDate = new Date(shift.date + "T00:00:00");
                const isUpcoming = shiftDate >= new Date();

                return (
                  <div
                    key={shift.id}
                    className={`bg-card border-l-4 border-border rounded-2xl p-5 flex items-start justify-between gap-4 transition-all ${
                      isUpcoming ? "hover:shadow-lg" : "opacity-60"
                    }`}
                    style={{ borderLeftColor: shift.staff_color || "#C89B4F" }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="font-body font-semibold">{shift.time_block}</p>
                      </div>
                      <p className="font-body text-sm text-muted-foreground">
                        {shiftDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                      </p>
                      {shift.role && (
                        <p className="font-body text-xs text-primary mt-1">Role: {shift.role}</p>
                      )}
                    </div>

                    {isUpcoming && (
                      <button
                        onClick={() => setSwapModal(shift)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" /> Request Swap
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {swapModal && (
        <SwapRequestModal
          shift={swapModal}
          staff={staff}
          allShifts={allShifts}
          onSubmit={submitSwapRequest}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  );
}