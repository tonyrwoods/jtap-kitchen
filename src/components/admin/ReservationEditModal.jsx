import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail, MessageSquare } from "lucide-react";
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
    admin_notes: reservation.admin_notes || "",
    sms_opt_in: reservation.sms_opt_in || false,
  });
  const [saving, setSaving] = useState(false);
  const [notifyGuest, setNotifyGuest] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSendSms = async () => {
    setSendingSms(true);
    try {
      await base44.functions.invoke("sendReservationSms", { reservation_id: reservation.id });
      toast.success("SMS confirmation sent");
    } catch (err) {
      toast.error("SMS failed: " + (err.message || "unknown error"));
    }
    setSendingSms(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error("Write a reply message first.");
      return;
    }
    setSendingReply(true);
    try {
      await base44.functions.invoke("sendReservationNoteReply", { reservation_id: reservation.id, message: replyText.trim() });
      toast.success("Reply sent to guest");
      setReplyText("");
    } catch (err) {
      toast.error("Reply failed: " + (err.message || "unknown error"));
    }
    setSendingReply(false);
  };

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
      admin_notes: form.admin_notes || null,
      sms_opt_in: !!form.sms_opt_in,
    };
    try {
      await base44.entities.Reservation.update(reservation.id, payload);
      onSaved({ ...reservation, ...payload });
      if (notifyGuest) {
        try {
          await base44.functions.invoke("sendReservationUpdateEmail", { reservation_id: reservation.id });
          toast.success("Reservation saved — confirmation email sent to guest");
        } catch (mailErr) {
          toast.error("Saved, but the email to the guest failed: " + (mailErr.message || "unknown error"));
        }
      } else {
        toast.success("Reservation saved");
      }
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
          <div className="rounded-lg bg-muted/40 border border-border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body text-sm font-semibold">Guest's Special Request</label>
              <span className="font-body text-xs text-muted-foreground">Guest-submitted</span>
            </div>
            <textarea rows={3} value={form.special_requests} onChange={e => set("special_requests", e.target.value)} className={`${inputCls} resize-none bg-background`} />
          </div>
          <div className="rounded-lg bg-muted/40 border border-border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body text-sm font-semibold">Admin Notes</label>
              <span className="font-body text-xs text-muted-foreground">Internal only — not sent to guest</span>
            </div>
            <textarea rows={2} value={form.admin_notes} onChange={e => set("admin_notes", e.target.value)} className={`${inputCls} resize-none bg-background`} placeholder="How this request was handled..." />
          </div>
          {reservation.special_requests ? (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <label className="font-body text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" /> Reply to the guest's note by email
              </label>
              <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} className={`${inputCls} resize-none mb-2`} placeholder={`Reply to their request: "${reservation.special_requests?.slice(0, 60)}..."`} />
              <button type="button" onClick={handleSendReply} disabled={sendingReply} className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {sendingReply ? "Sending..." : "Send Reply"}
              </button>
            </div>
          ) : null}
          <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-text">
              <input type="checkbox" checked={form.sms_opt_in} onChange={e => set("sms_opt_in", e.target.checked)} className="w-4 h-4" />
              <span className="font-body text-sm">Guest opted in to SMS confirmations</span>
            </label>
            {form.sms_opt_in && form.phone ? (
              <button type="button" onClick={handleSendSms} disabled={sendingSms} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">
                <MessageSquare className="w-3.5 h-3.5" />
                {sendingSms ? "Sending…" : reservation.sms_sent_at ? "Resend SMS Confirmation ✓" : "Send SMS Confirmation"}
              </button>
            ) : form.sms_opt_in && !form.phone ? (
              <p className="font-body text-xs text-amber-700">Add a phone number to enable SMS.</p>
            ) : null}
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-text">
            <input type="checkbox" checked={notifyGuest} onChange={e => setNotifyGuest(e.target.checked)} className="w-4 h-4" />
            <span className="font-body text-sm">Notify guest by email about these changes</span>
          </label>
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