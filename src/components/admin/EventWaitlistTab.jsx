import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, Mail, X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EventWaitlistTab() {
  const [waitlist, setWaitlist] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Waiting");
  const [notifyLoading, setNotifyLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [waitlistData, eventsData] = await Promise.all([
      base44.entities.EventWaitlist.list("-created_date", 200),
      base44.entities.Event.list("date", 100),
    ]);
    setWaitlist(waitlistData);
    setEvents(eventsData);
    setLoading(false);
  };

  const filtered = waitlist.filter(w => {
    const statusMatch = selectedStatus === "All" || w.status === selectedStatus;
    const eventMatch = !selectedEvent || w.event_id === selectedEvent;
    return statusMatch && eventMatch;
  });

  const statusConfig = {
    Waiting: { icon: Clock, color: "bg-blue-100 text-blue-700", label: "Waiting" },
    Notified: { icon: Mail, color: "bg-green-100 text-green-700", label: "Notified" },
    Booked: { icon: CheckCircle, color: "bg-purple-100 text-purple-700", label: "Booked" },
    Cancelled: { icon: X, color: "bg-red-100 text-red-700", label: "Cancelled" },
  };

  const handleNotify = async (event_id) => {
    const event = events.find(e => e.id === event_id);
    if (!event) return;

    const confirmed = confirm(`Notify waitlist for "${event.title}"?\n\nThis will email all waiting members that a spot has opened.`);
    if (!confirmed) return;

    setNotifyLoading(true);
    try {
      const result = await base44.functions.invoke("notifyEventWaitlist", {
        event_id,
        spots_opened: 1,
      });
      toast.success(result.data.message || "Waitlist notified");
      await loadData();
    } catch (error) {
      toast.error("Failed to notify waitlist");
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleRemoveFromWaitlist = async (id) => {
    if (!confirm("Remove from waitlist?")) return;
    await base44.entities.EventWaitlist.update(id, { status: "Cancelled" });
    await loadData();
    toast.success("Removed from waitlist");
  };

  const stats = [
    { label: "Total Waiting", value: waitlist.filter(w => w.status === "Waiting").length, color: "bg-blue-500" },
    { label: "Notified", value: waitlist.filter(w => w.status === "Notified").length, color: "bg-green-500" },
    { label: "Booked", value: waitlist.filter(w => w.status === "Booked").length, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">{s.label}</p>
              <p className="font-heading text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedEvent || ""}
          onChange={e => setSelectedEvent(e.target.value || null)}
          className="border border-border rounded-lg px-4 py-2 text-sm bg-background"
        >
          <option value="">All Events</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {["All", "Waiting", "Notified", "Booked", "Cancelled"].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No waitlist entries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const cfg = statusConfig[entry.status];
            const Icon = cfg.icon;
            const event = events.find(e => e.id === entry.event_id);

            return (
              <motion.div
                key={entry.id}
                layout
                className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-body font-semibold">{entry.guest_name}</p>
                      <p className="font-body text-xs text-muted-foreground">{entry.email}</p>
                    </div>
                  </div>
                  <div className="text-sm mt-2">
                    <p className="font-body text-muted-foreground">
                      <span className="text-foreground font-medium">{entry.event_title}</span> • {entry.party_size} {entry.party_size === 1 ? "guest" : "guests"}
                    </p>
                    {entry.notes && <p className="font-body text-xs text-muted-foreground italic mt-1">"{entry.notes}"</p>}
                    {entry.notification_sent_date && (
                      <p className="font-body text-xs text-muted-foreground mt-1">Notified: {entry.notification_sent_date}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === "Waiting" && event && (
                    <button
                      onClick={() => handleNotify(entry.event_id)}
                      disabled={notifyLoading}
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <Mail className="w-3 h-3 inline mr-1" /> Notify
                    </button>
                  )}
                  {entry.status !== "Booked" && (
                    <button
                      onClick={() => handleRemoveFromWaitlist(entry.id)}
                      className="px-4 py-2 border border-destructive text-destructive text-xs font-semibold rounded-lg hover:bg-destructive/10 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}