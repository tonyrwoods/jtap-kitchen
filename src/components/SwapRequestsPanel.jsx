import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, ArrowLeftRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES = {
  Pending:  "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Denied:   "bg-red-100 text-red-800",
};

export default function SwapRequestsPanel({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");

  const load = async () => {
    const data = await base44.entities.ShiftSwapRequest.list("-created_date", 100);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.ShiftSwapRequest.subscribe(event => {
      if (event.type === "create") setRequests(prev => [event.data, ...prev]);
      else if (event.type === "update") setRequests(prev => prev.map(r => r.id === event.id ? event.data : r));
    });
    return unsub;
  }, []);

  const handleDecision = async (id, status) => {
    await base44.entities.ShiftSwapRequest.update(id, { status });
    if (status === "Approved") {
      // Perform the actual shift swap
      const req = requests.find(r => r.id === id);
      if (req) {
        await Promise.all([
          base44.entities.Shift.update(req.requester_shift_id, {
            staff_id: req.target_staff_id,
            staff_name: req.target_staff_name,
          }),
          base44.entities.Shift.update(req.target_shift_id, {
            staff_id: req.requester_staff_id,
            staff_name: req.requester_staff_name,
          }),
        ]);
      }
      toast.success("Swap approved and shifts updated!");
    } else {
      toast.success("Swap request denied.");
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const filtered = requests.filter(r => filter === "All" || r.status === filter);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Shift Swap Requests</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-border">
          {["Pending", "Approved", "Denied", "All"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f}
              {f === "Pending" && (
                <span className="ml-1.5 bg-white/30 rounded-full px-1.5 text-xs">
                  {requests.filter(r => r.status === "Pending").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-body text-sm text-muted-foreground">No {filter.toLowerCase()} requests</p>
            </div>
          ) : filtered.map(req => (
            <div key={req.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
              {/* Status badge + time */}
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-body font-semibold ${STATUS_STYLES[req.status]}`}>
                  {req.status}
                </span>
                <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(req.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Swap details */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/40 rounded-lg p-2.5 text-center">
                  <p className="font-body text-xs font-semibold">{req.requester_staff_name}</p>
                  <p className="font-body text-xs text-muted-foreground">{req.requester_shift_date}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">{req.requester_shift_block?.split(" (")[0]}</p>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 bg-muted/40 rounded-lg p-2.5 text-center">
                  <p className="font-body text-xs font-semibold">{req.target_staff_name}</p>
                  <p className="font-body text-xs text-muted-foreground">{req.target_shift_date}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">{req.target_shift_block?.split(" (")[0]}</p>
                </div>
              </div>

              {req.reason && (
                <p className="font-body text-xs text-muted-foreground italic">"{req.reason}"</p>
              )}

              {/* Actions */}
              {req.status === "Pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleDecision(req.id, "Approved")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-full font-body text-xs font-medium hover:opacity-90"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, "Denied")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-full font-body text-xs font-medium hover:opacity-90"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}