import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function ReservationEditModal({ reservation, onSaved, onClose }) {
  const [form, setForm] = useState({
    guest_name: reservation.guest_name || "",
    email: reservation.email || "",
    phone: reservation.phone || "",
    date: reservation.date || "",
    time: reservation.time || "",
    party_size: reservation.party_size || 1,
    special_requests: reservation.special_requests || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.email || !form.date || !form.time || !form.party_size) {
      toast.error("Name, email, date, time, and party size are required.");
      return;
    }
    setSaving(true);
    const payload = {
      guest_name: form.guest_name,
      email: form.email,
      phone: form.phone || null,
      date: form.date,
      time: form.time,
      party_size: parseInt(form.party_size) || 1,
      special_requests: form.special_requests || null,
    };
    try {
      await base44.entities.Reservation.update(reservation.id, payload);
      onSaved({ ...reservation, ...payload });
    } catch (err) {
      toast.error(err.message || "Failed to update reservation");
    }
    setSaving(false);
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-lg font-semibold">Edit Reservation</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Guest Name *</label>
            <input value={form.guest_name} onChange={e => set("guest_name", e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Date *</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Time *</label>
              <input value={form.time} onChange={e => set("time", e.target.value)} placeholder="7:00 PM" className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Party Size *</label>
            <input type="number" min="1" value={form.party_size} onChange={e => set("party_size", e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Special Requests</label>
            <textarea rows={3} value={form.special_requests} onChange={e => set("special_requests", e.target.value)} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}