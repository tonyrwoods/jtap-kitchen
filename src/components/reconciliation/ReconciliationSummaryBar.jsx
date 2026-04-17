import { CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";

export default function ReconciliationSummaryBar({ transactions }) {
  const total = transactions.length;
  const confirmed = transactions.filter(t => t.reconciliation_status === "Confirmed").length;
  const unmatched = transactions.filter(t => t.reconciliation_status === "Unmatched").length;
  const autoMatched = transactions.filter(t => t.reconciliation_status === "Auto-Matched").length;
  const dismissed = transactions.filter(t => t.reconciliation_status === "Dismissed").length;

  const totalDebits = transactions.filter(t => t.transaction_type === "Debit").reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions.filter(t => t.transaction_type === "Credit").reduce((sum, t) => sum + t.amount, 0);

  const stats = [
    { label: "Confirmed", value: confirmed, icon: CheckCircle2, color: "text-green-700 bg-green-100" },
    { label: "Unmatched", value: unmatched, icon: AlertCircle, color: "text-orange-700 bg-orange-100" },
    { label: "Auto-Matched", value: autoMatched, icon: Clock, color: "text-yellow-700 bg-yellow-100" },
    { label: "Dismissed", value: dismissed, icon: XCircle, color: "text-red-600 bg-red-100" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-body text-xs text-muted-foreground">{label}</p>
              <p className="font-heading text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-6 pt-2 border-t border-border">
        <div>
          <p className="font-body text-xs text-muted-foreground">Total Debits</p>
          <p className="font-heading text-base font-bold text-red-700">−${totalDebits.toFixed(2)}</p>
        </div>
        <div>
          <p className="font-body text-xs text-muted-foreground">Total Credits</p>
          <p className="font-heading text-base font-bold text-green-700">+${totalCredits.toFixed(2)}</p>
        </div>
        <div>
          <p className="font-body text-xs text-muted-foreground">Net</p>
          <p className={`font-heading text-base font-bold ${totalCredits - totalDebits >= 0 ? "text-green-700" : "text-red-700"}`}>
            {totalCredits - totalDebits >= 0 ? "+" : ""}${(totalCredits - totalDebits).toFixed(2)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-body text-xs text-muted-foreground">Reconciled</p>
          <p className="font-heading text-base font-bold">
            {total > 0 ? Math.round((confirmed / total) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}