import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, CalendarDays, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const money = (n) => `$${Number(n || 0).toLocaleString("en-US")}`;
function formatDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function EventDepositConfirmed() {
  const [inq, setInq] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    document.title = "Deposit Confirmed — JTAP Kitchen";
    if (!id) { setLoading(false); return; }
    base44.functions.invoke("getEventInquiryPublic", { id })
      .then((res) => setInq(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const ref = (inq?.id || id || "").substring(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2">Deposit Received!</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Your event inquiry has been submitted and your deposit is confirmed. A confirmation email is on its way.
        </p>

        {loading ? (
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-6" />
        ) : inq ? (
          <div className="bg-muted/40 border border-border rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-body font-semibold">{inq.package || inq.package_name || "Event Package"}</p>
                <p className="font-body text-xs text-muted-foreground">Estimated total {money(inq.estimated_total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-muted-foreground">{formatDate(inq.preferred_date || inq.event_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-muted-foreground">{inq.guest_count || "—"} guests</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-body text-sm text-muted-foreground">Deposit paid</span>
              <span className="font-heading text-lg font-bold text-primary">{money(inq.deposit_amount)}</span>
            </div>
          </div>
        ) : null}

        <p className="font-body text-xs text-muted-foreground font-mono mb-4">Reference: JTAP-{ref}</p>
        <p className="font-body text-xs text-muted-foreground mb-6">Our events team will contact you within 24 hours to finalize the details.</p>
        <Link to="/" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90">
          Back to Home
        </Link>
      </div>
    </div>
  );
}