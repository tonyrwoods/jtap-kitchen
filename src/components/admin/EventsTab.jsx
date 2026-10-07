import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarDays, Clock, Users, Ticket, Star, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_TYPES = [
  "Wine Tasting", "Tasting Menu", "Holiday Dinner",
  "Chef's Table", "Cooking Class", "Special Occasion", "Other",
];

const TYPE_COLORS = {
  "Wine Tasting": "bg-purple-100 text-purple-700",
  "Tasting Menu": "bg-amber-100 text-amber-700",
  "Holiday Dinner": "bg-red-100 text-red-700",
  "Chef's Table": "bg-amber-100 text-amber-700",
  "Cooking Class": "bg-green-100 text-green-700",
  "Special Occasion": "bg-pink-100 text-pink-700",
  "Other": "bg-muted text-muted-foreground",
};

const emptyForm = {
  title: "", description: "", event_type: "Special Occasion",
  date: "", time: "18:00", duration_minutes: 120,
  image_url: "", price_per_guest: 0, max_capacity: 50,
  spots_available: 50, menu_details: "",
  featured: false, is_published: true,
};

function EventForm({ event, onSave, onCancel }) {
  const [form, setForm] = useState(event ? { ...emptyForm, ...event } : emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set("image_url", file_url);
    } catch {
      toast.error("Image upload failed");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) {
      toast.error("Title, date, and time are required");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        price_per_guest: Number(form.price_per_guest) || 0,
        max_capacity: Number(form.max_capacity) || 0,
        spots_available: Number(form.spots_available) || 0,
        duration_minutes: Number(form.duration_minutes) || 120,
      };
      if (event?.id) {
        await base44.entities.Event.update(event.id, data);
        toast.success("Event updated");
      } else {
        await base44.entities.Event.create(data);
        toast.success("Event created");
      }
      onSave();
    } catch (err) {
      toast.error("Failed to save: " + (err.message || "unknown error"));
    }
    setSaving(false);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">{event?.id ? "Edit" : "New"} Ticketed Event</h3>
        <button type="button" onClick={onCancel} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Event Title *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.title} onChange={e => set("title", e.target.value)} required />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Event Type *</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.event_type} onChange={e => set("event_type", e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Date *</label>
          <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.date} onChange={e => set("date", e.target.value)} required />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Start Time *</label>
          <input type="time" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.time} onChange={e => set("time", e.target.value)} required />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Duration (minutes)</label>
          <input type="number" min="15" step="15" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Price per Guest ($)</label>
          <input type="number" min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.price_per_guest} onChange={e => set("price_per_guest", e.target.value)} />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Max Capacity *</label>
          <input type="number" min="1" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.max_capacity} onChange={e => set("max_capacity", e.target.value)} required />
        </div>

        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Spots Available</label>
          <input type="number" min="0" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={form.spots_available} onChange={e => set("spots_available", e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-2 block">Event Image</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-sm text-muted-foreground">{uploading ? "Uploading…" : "Choose image"}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
            </label>
            {form.image_url && <img src={form.image_url} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-border" />}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" rows={3} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Menu Details / Itinerary</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" rows={2} value={form.menu_details} onChange={e => set("menu_details", e.target.value)} />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="rounded" />
            <Star className="w-3.5 h-3.5 text-primary" /> Featured
          </label>
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={form.is_published} onChange={e => set("is_published", e.target.checked)} className="rounded" />
            Publish on website
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : "Save Event"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </motion.form>
  );
}

export default function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.Event.list("date", 100)
      .then(setEvents)
      .catch(() => toast.error("Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (ev) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    await base44.entities.Event.delete(ev.id);
    setEvents(prev => prev.filter(e => e.id !== ev.id));
    toast.success("Event deleted");
  };

  const startEdit = (ev) => {
    setEditing(ev);
    setShowForm(true);
  };

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const formatDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Ticketed Events</h3>
          <p className="font-body text-sm text-muted-foreground">Public events that appear on your /events page with booking.</p>
        </div>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" /> New Event
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <EventForm
            event={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No ticketed events yet.</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold">
            <Plus className="w-4 h-4" /> Create your first event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(ev => {
            const isPast = ev.date < today;
            const soldOut = (ev.spots_available ?? 0) <= 0;
            return (
              <div key={ev.id} className={`bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow ${isPast ? "opacity-60" : ""}`}>
                {ev.image_url ? (
                  <img src={ev.image_url} alt={ev.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-primary/40" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-heading text-base font-semibold leading-tight">{ev.title}</h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ev.featured && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ev.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {ev.is_published ? "Live" : "Hidden"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDate(ev.date)}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.time}</span>
                    <span className={`px-1.5 py-0.5 rounded-full font-semibold ${TYPE_COLORS[ev.event_type] || TYPE_COLORS["Other"]}`}>{ev.event_type}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {ev.spots_available ?? "—"}/{ev.max_capacity ?? "—"} spots</span>
                    <span className="inline-flex items-center gap-1"><Ticket className="w-3 h-3" /> {Number(ev.price_per_guest) === 0 ? "Free" : `$${Number(ev.price_per_guest).toFixed(2)}`}</span>
                    {isPast && <span className="text-amber-600 font-medium">Past event</span>}
                    {soldOut && !isPast && <span className="text-red-600 font-medium">Sold out</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button onClick={() => startEdit(ev)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg font-body text-xs font-medium hover:bg-muted transition-colors">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(ev)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-destructive rounded-lg font-body text-xs font-medium hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}