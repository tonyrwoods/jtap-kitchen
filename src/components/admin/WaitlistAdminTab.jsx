import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Check, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STATUS_COLORS = {
  Waiting: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Table Ready": "bg-green-100 text-green-800 border-green-300",
  Seated: "bg-blue-100 text-blue-800 border-blue-300",
  "No-show": "bg-gray-100 text-gray-800 border-gray-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

function AddGuestForm({ onAdded, onCancel }) {
  const [form, setForm] = useState({
    guest_name: "",
    email: "",
    phone: "",
    party_size: 2,
    preferred_table_type: "Any",
    special_requests: "",
    estimated_wait_minutes: 15
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.entities.Waitlist.create({
      ...form,
      status: "Waiting",
      added_at: new Date().toISOString(),
      notification_sent: false
    });
    toast.success("Guest added to waitlist");
    onAdded();
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6"
    >
      <h3 className="font-heading text-lg font-semibold mb-4">Add Guest to Waitlist</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Name *</label>
            <input
              required
              value={form.guest_name}
              onChange={e => setForm({...form, guest_name: e.target.value})}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Party Size *</label>
            <input
              required
              type="number"
              min="1"
              value={form.party_size}
              onChange={e => setForm({...form, party_size: parseInt(e.target.value) || 1})}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Table Preference</label>
            <select
              value={form.preferred_table_type}
              onChange={e => setForm({...form, preferred_table_type: e.target.value})}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              {["Any", "Window", "Quiet Corner", "Bar"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Est. Wait (min)</label>
            <input
              type="number"
              min="5"
              value={form.estimated_wait_minutes}
              onChange={e => setForm({...form, estimated_wait_minutes: parseInt(e.target.value) || 15})}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-body text-xs text-muted-foreground mb-1 block">Special Requests</label>
            <textarea
              value={form.special_requests}
              onChange={e => setForm({...form, special_requests: e.target.value})}
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
            {submitting ? "Adding..." : "Add Guest"}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function WaitlistEntry({ entry, onStatusChange, onDelete, onNotify }) {
  const waitTime = Math.round((Date.now() - new Date(entry.added_at).getTime()) / 60000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md transition-shadow"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-body font-semibold text-foreground">{entry.guest_name}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[entry.status]}`}>
            {entry.status}
          </span>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          Party of {entry.party_size} • {entry.preferred_table_type}
        </p>
        <p className="font-body text-xs text-muted-foreground">{entry.email} {entry.phone && `• ${entry.phone}`}</p>
        {entry.special_requests && (
          <p className="font-body text-xs text-primary mt-1 italic">"{entry.special_requests}"</p>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-body text-xs text-muted-foreground">
            Waiting {waitTime}m (Est. {entry.estimated_wait_minutes}m)
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap sm:flex-col">
        {entry.status === "Waiting" && (
          <>
            <button
              onClick={() => onStatusChange(entry.id, "Table Ready")}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
            >
              <Check className="w-3 h-3" /> Ready
            </button>
            <button
              onClick={() => onNotify(entry.id, entry.guest_name, entry.email, entry.phone)}
              disabled={entry.notification_sent}
              className="flex items-center gap-1 px-3 py-1.5 border border-primary text-primary rounded-lg text-xs font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <AlertCircle className="w-3 h-3" /> Notify
            </button>
          </>
        )}
        {entry.status === "Table Ready" && (
          <button
            onClick={() => onStatusChange(entry.id, "Seated")}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <Check className="w-3 h-3" /> Seated
          </button>
        )}
        <button
          onClick={() => onDelete(entry.id)}
          className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      </div>
    </motion.div>
  );
}

export default function WaitlistAdminTab() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Waiting");

  useEffect(() => {
    fetchWaitlist();
    const interval = setInterval(fetchWaitlist, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchWaitlist = async () => {
    const data = await base44.entities.Waitlist.filter(
      { status: ["Waiting", "Table Ready", "Seated"] },
      "-added_at",
      100
    );
    setWaitlist(data.filter(w => w.status !== "Seated" && w.status !== "No-show" && w.status !== "Cancelled"));
    setLoading(false);
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Waitlist.update(id, { status });
    toast.success(`Status updated to ${status}`);
    fetchWaitlist();
  };

  const handleDelete = async (id) => {
    if (confirm("Remove from waitlist?")) {
      await base44.entities.Waitlist.update(id, { status: "Cancelled" });
      toast.success("Guest removed");
      fetchWaitlist();
    }
  };

  const handleNotify = async (id, name, email, phone) => {
    try {
      await base44.functions.invoke("sendTableReadyEmail", { waitlistId: id, guestName: name, guestEmail: email, guestPhone: phone });
      toast.success(phone ? "Table-ready email & text sent to " + name : "Email sent to " + name);
      fetchWaitlist();
    } catch (error) {
      toast.error("Failed to send notification");
    }
  };

  const activeCount = waitlist.filter(w => w.status === "Waiting").length;
  const readyCount = waitlist.filter(w => w.status === "Table Ready").length;

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active", value: activeCount, color: "bg-yellow-100" },
          { label: "Ready", value: readyCount, color: "bg-green-100" },
          { label: "Total", value: waitlist.length, color: "bg-blue-100" },
        ].map(s => (
          <div key={s.label} className={`${s.color} border border-border rounded-xl p-4`}>
            <p className="font-body text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="font-heading text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Guest */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Walk-in Guest
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <AddGuestForm onAdded={() => { setShowForm(false); fetchWaitlist(); }} onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>

      {/* Waitlist */}
      <div>
        <h3 className="font-heading text-lg font-semibold mb-4">Current Waitlist</h3>
        <div className="space-y-3">
          {waitlist.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="font-body text-muted-foreground">No guests waiting</p>
            </div>
          ) : (
            waitlist.map(entry => (
              <WaitlistEntry
                key={entry.id}
                entry={entry}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNotify={handleNotify}
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}