import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Star, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800",
  Reviewed: "bg-blue-100 text-blue-800",
  Addressed: "bg-green-100 text-green-800",
};

export default function GuestFeedbackTab() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === "All" ? {} : { status: statusFilter };
      const page = await base44.entities.GuestFeedback.filter(query, {
        sort: "-created_date",
        limit: 50,
      });
      setFeedback(page.items || []);
    } catch {
      toast.error("Could not load feedback");
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (item) => {
    setSelected(item);
    setEditForm({
      status: item.status || "Pending",
      admin_response: item.admin_response || "",
      admin_notes: item.admin_notes || "",
    });
  };

  const saveDetail = async () => {
    try {
      await base44.entities.GuestFeedback.update(selected.id, editForm);
      const updated = { ...selected, ...editForm };
      setSelected(updated);
      setFeedback(prev => prev.map(f => f.id === updated.id ? updated : f));
      toast.success("Feedback updated");
    } catch {
      toast.error("Could not update feedback");
    }
  };

  const npsBadge = (score) => {
    if (score >= 9) return { label: "Promoter", cls: "bg-green-100 text-green-800" };
    if (score >= 7) return { label: "Passive", cls: "bg-yellow-100 text-yellow-800" };
    return { label: "Detractor", cls: "bg-red-100 text-red-800" };
  };

  return (
    <div className="space-y-6">
      {/* Status filter */}
      <div className="flex gap-2">
        {["All", "Pending", "Reviewed", "Addressed"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : feedback.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No feedback yet.</p>
          ) : feedback.map(item => {
            const badge = npsBadge(item.nps_score);
            return (
              <button
                key={item.id}
                onClick={() => openDetail(item)}
                className={`w-full text-left bg-card border rounded-xl p-4 transition-all hover:shadow-sm ${
                  selected?.id === item.id ? "border-primary ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{item.guest_name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{item.nps_score} - {badge.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[item.status] || ""}`}>{item.status}</span>
                </div>
                {item.what_went_well && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">"Good: {item.what_went_well}"</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold">{selected.guest_name}</h3>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                {selected.visit_date && <p className="text-xs text-muted-foreground">Visited: {new Date(selected.visit_date).toLocaleDateString()}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <span key={i} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    i <= selected.nps_score ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{i}</span>
                ))}
              </div>
            </div>
            {(() => { const b = npsBadge(selected.nps_score); return <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.cls}`}>{b.label}</span>; })()}

            {selected.what_went_well && (
              <div><p className="text-xs text-muted-foreground mb-1 font-medium">What went well</p><p className="text-sm">{selected.what_went_well}</p></div>
            )}
            {selected.what_could_improve && (
              <div><p className="text-xs text-muted-foreground mb-1 font-medium">What could be improved</p><p className="text-sm">{selected.what_could_improve}</p></div>
            )}
            {selected.would_recommend !== undefined && selected.would_recommend !== null && (
              <div className="flex items-center gap-2 text-sm">
                {selected.would_recommend ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                {selected.would_recommend ? "Would recommend us" : "Would not recommend"}
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Addressed">Addressed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Admin Response (internal)</label>
                <textarea
                  value={editForm.admin_response}
                  onChange={e => setEditForm(f => ({ ...f, admin_response: e.target.value }))}
                  rows={2}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Internal Notes</label>
                <textarea
                  value={editForm.admin_notes}
                  onChange={e => setEditForm(f => ({ ...f, admin_notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
              <button
                onClick={saveDetail}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm h-fit sticky top-4">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Select feedback to review
          </div>
        )}
      </div>
    </div>
  );
}