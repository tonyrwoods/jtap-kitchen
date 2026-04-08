import { X, User, Mail, Phone, Users, Clock, MessageSquare } from "lucide-react";

export default function ReservationDetailModal({ reservation, onClose }) {
  if (!reservation) return null;

  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
    Completed: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="font-heading text-lg font-semibold">Reservation Details</h3>
          <button onClick={onClose} className="p-1.5 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-xl font-semibold">{reservation.guest_name}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[reservation.status] || "bg-muted text-muted-foreground"}`}>
              {reservation.status || "Pending"}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { icon: Clock, label: `${reservation.date} at ${reservation.time}` },
              { icon: Users, label: `${reservation.party_size} guest${reservation.party_size > 1 ? "s" : ""}` },
              { icon: Mail, label: reservation.email },
              { icon: Phone, label: reservation.phone || "—" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-body text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
            {reservation.special_requests && (
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-sm text-muted-foreground italic">"{reservation.special_requests}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}