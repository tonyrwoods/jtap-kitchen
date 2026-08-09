import { Check, X, Clock } from "lucide-react";
import CompanionInviteForm from "@/components/CompanionInviteForm";

function fmt(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function ReservationRsvpPanel({ reservation }) {
  const confirmed = !!reservation.confirmed_at;
  const declined = !!reservation.declined_at;

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {confirmed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <Check className="w-3 h-3" /> Confirmed by guest · {fmt(reservation.confirmed_at)}
          </span>
        )}
        {declined && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <X className="w-3 h-3" /> Declined by guest · {fmt(reservation.declined_at)}
          </span>
        )}
        {!confirmed && !declined && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
            <Clock className="w-3 h-3" /> Awaiting guest confirmation
          </span>
        )}
      </div>

      {reservation.confirm_token ? (
        <CompanionInviteForm
          confirmToken={reservation.confirm_token}
          reservationId={reservation.id}
          partySize={reservation.party_size || 1}
          adminMode
        />
      ) : (
        <p className="font-body text-xs text-muted-foreground">
          No confirmation link on file for this reservation, so companion invites can't be sent.
        </p>
      )}
    </div>
  );
}