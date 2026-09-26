import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ReservationEmailModal({ reservation, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke("sendReservationMessage", {
        reservation_id: reservation.id,
        subject: subject.trim(),
        message: body.trim(),
      });
      toast.success("Email sent to guest");
      onClose();
    } catch (err) {
      toast.error("Email failed: " + (err.message || "unknown error"));
    }
    setSending(false);
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Email Guest
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <p className="font-body text-xs text-muted-foreground">
            To: <span className="font-medium text-foreground">{reservation.guest_name}</span> · {reservation.email}
          </p>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="Subject" />
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Message</label>
            <textarea rows={5} value={body} onChange={e => setBody(e.target.value)} className={`${inputCls} resize-none`} placeholder="Write a message to the guest…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={handleSend} disabled={sending} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
              {sending ? "Sending..." : "Send Email"}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}