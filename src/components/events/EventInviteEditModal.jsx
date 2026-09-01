import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["Pending", "Attending", "Declined", "Maybe", "Waitlisted"];

export default function EventInviteEditModal({ invite, promotion, onSaved, onClose }) {
  const [form, setForm] = useState({
    guest_name: invite.guest_name || "",
    guest_email: invite.guest_email || "",
    rsvp_status: invite.rsvp_status || "Pending",
    party_size: invite.party_size || 1,
    plus_ones: invite.plus_ones || "",
    dietary_notes: invite.dietary_notes || "",
    discount_amount: invite.discount_amount || 0,
    discount_code: invite.discount_code || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.guest_email) {
      toast.error("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        guest_name: form.guest_name,
        guest_email: form.guest_email,
        rsvp_status: form.rsvp_status,
        party_size: parseInt(form.party_size) || 1,
        plus_ones: form.plus_ones || null,
        dietary_notes: form.dietary_notes || null,
        discount_amount: parseFloat(form.discount_amount) || 0,
        discount_code: form.discount_code || null,
      };
      if (form.rsvp_status !== invite.rsvp_status) {
        payload.rsvp_responded_at = new Date().toISOString();
      }
      await base44.entities.EventInvite.update(invite.id, payload);
      onSaved({ ...invite, ...payload });
      toast.success("RSVP updated");
    } catch (err) {
      toast.error(err.message || "Failed to update RSVP");
    }
    setSaving(false);
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-lg font-semibold">Edit RSVP</h3>
            <p className="font-body text-xs text-muted-foreground mt-0.5">{promotion?.title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Guest Name *</label>
            <input value={form.guest_name} onChange={(e) => set("guest_name", e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
            <input type="email" value={form.guest_email} onChange={(e) => set("guest_email", e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">RSVP Status</label>
              <select value={form.rsvp_status} onChange={(e) => set("rsvp_status", e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Party Size</label>
              <input type="number" min="1" value={form.party_size} onChange={(e) => set("party_size", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Plus One Names</label>
            <input value={form.plus_ones} onChange={(e) => set("plus_ones", e.target.value)} className={inputCls} placeholder="e.g. Sarah Johnson" />
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Dietary Notes / Special Requests</label>
            <textarea rows={2} value={form.dietary_notes} onChange={(e) => set("dietary_notes", e.target.value)} className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Discount Amount ($)</label>
              <input type="number" step="0.01" min="0" value={form.discount_amount} onChange={(e) => set("discount_amount", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Discount Code</label>
              <input value={form.discount_code} onChange={(e) => set("discount_code", e.target.value)} className={inputCls} />
            </div>
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