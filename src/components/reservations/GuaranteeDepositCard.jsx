import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// Optional deposit offer shown after a reservation is confirmed. The guest's
// table is already booked — paying a deposit simply guarantees it. The amount
// is resolved server-side by create-reservation-deposit-checkout; the values
// here are display only.
export default function GuaranteeDepositCard({ reservationId, partySize, perGuest, amount }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("create-reservation-deposit-checkout", { reservationId });
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
        return;
      }
      toast.error(res.data?.error || "Could not start payment. Please try again.");
    } catch {
      toast.error("Could not start payment. Please try again.");
    }
    setLoading(false);
  };

  const total = Number(amount) || (Number(perGuest) || 0) * (Number(partySize) || 0);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-left">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-heading text-lg font-semibold text-foreground">Guarantee your table</p>
          <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">
            Optional — your reservation is confirmed. Pay ${total.toFixed(2)} (${perGuest} per guest for {partySize} {partySize === 1 ? "guest" : "guests"}) to guarantee it.
          </p>
          <button
            onClick={handlePay}
            disabled={loading}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Starting payment…" : `Pay $${total.toFixed(2)} deposit`}
          </button>
        </div>
      </div>
    </div>
  );
}