import { Lock, CalendarDays, Users, Sparkles } from "lucide-react";

const money = (n) => `$${Number(n || 0).toLocaleString("en-US")}`;
function formatDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function WizardStepDeposit({ form, packagePrice, packageDeposit, estimatedTotal }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Deposit & submit</h3>
        <p className="font-body text-sm text-muted-foreground">Secure your date with a deposit. The remaining balance is due 7 days before your event.</p>
      </div>

      <div className="bg-muted/40 border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-body font-semibold text-foreground">{form.package}</p>
            <p className="font-body text-sm text-muted-foreground">Starting at {money(packagePrice)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="font-body text-muted-foreground">{formatDate(form.preferred_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-body text-muted-foreground">{form.guest_count || "—"} guests</span>
          </div>
        </div>
        <div className="border-t border-border pt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Estimated total</span>
            <span className="font-heading text-sm font-semibold">{money(estimatedTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Deposit due now</span>
            <span className="font-heading text-lg font-bold text-primary">{money(packageDeposit)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="font-body text-xs text-muted-foreground">
          You'll be taken to our secure payment page to pay the <strong className="text-foreground">{money(packageDeposit)}</strong> deposit.
          Once paid, your inquiry is submitted to our events team and you'll receive a confirmation email.
        </p>
      </div>
    </div>
  );
}