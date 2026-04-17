import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Link2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CONFIDENCE_STYLES = {
  High:   "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Low:    "bg-orange-100 text-orange-800 border-orange-300",
  Manual: "bg-blue-100 text-blue-800 border-blue-300",
};

const STATUS_STYLES = {
  Unmatched:     "bg-gray-100 text-gray-600",
  "Auto-Matched":"bg-yellow-100 text-yellow-800",
  Confirmed:     "bg-green-100 text-green-800",
  Dismissed:     "bg-red-100 text-red-700",
};

export default function TransactionRow({ txnData, onUpdated }) {
  const { txn, matches } = txnData;
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || "");

  const bestMatch = matches[0];
  const isConfirmed = txn.reconciliation_status === "Confirmed";
  const isDismissed = txn.reconciliation_status === "Dismissed";

  const confirm = async (match) => {
    setConfirming(true);
    await base44.entities.BankTransaction.update(txn.id, {
      reconciliation_status: "Confirmed",
      matched_to: match.type,
      matched_id: match.id,
      matched_label: match.label,
      match_confidence: match.confidence,
    });
    // Mark the vendor payment as reconciled if applicable
    if (match.type === "vendor_payment") {
      await base44.entities.VendorPayment.update(match.id, { is_reconciled: true, reconciled_date: new Date().toISOString().split("T")[0] });
    }
    toast.success("Match confirmed");
    setConfirming(false);
    onUpdated();
  };

  const dismiss = async () => {
    setConfirming(true);
    await base44.entities.BankTransaction.update(txn.id, {
      reconciliation_status: "Dismissed",
      matched_to: "unmatched",
    });
    toast.success("Transaction dismissed");
    setConfirming(false);
    onUpdated();
  };

  const restore = async () => {
    await base44.entities.BankTransaction.update(txn.id, { reconciliation_status: "Unmatched", matched_to: "unmatched", matched_id: null, matched_label: null });
    onUpdated();
  };

  return (
    <div className={`border rounded-xl transition-all ${isConfirmed ? "border-green-300 bg-green-50/40" : isDismissed ? "border-red-200 bg-red-50/20 opacity-60" : "border-border bg-background"}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Date */}
        <div className="w-24 shrink-0">
          <p className="font-body text-xs text-muted-foreground">{new Date(txn.transaction_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        </div>

        {/* Description + account */}
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium truncate">{txn.description || "—"}</p>
          <p className="font-body text-xs text-muted-foreground truncate">{txn.payment_method_label}</p>
        </div>

        {/* Amount */}
        <div className="text-right w-24 shrink-0">
          <p className={`font-heading text-sm font-bold ${txn.transaction_type === "Credit" ? "text-green-700" : "text-red-700"}`}>
            {txn.transaction_type === "Credit" ? "+" : "−"}${Number(txn.amount).toFixed(2)}
          </p>
          <p className="font-body text-xs text-muted-foreground">{txn.transaction_type}</p>
        </div>

        {/* Status */}
        <div className="w-28 shrink-0 hidden sm:block">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[txn.reconciliation_status] || STATUS_STYLES["Unmatched"]}`}>
            {txn.reconciliation_status}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isConfirmed && (
            <button onClick={restore} title="Undo" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {isDismissed && (
            <button onClick={restore} title="Restore" className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-xs font-body">
              Restore
            </button>
          )}
          {!isConfirmed && !isDismissed && (
            <>
              {matches.length > 0 && (
                <button onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg font-body text-xs font-semibold hover:bg-primary/20 transition-colors">
                  <Link2 className="w-3 h-3" />
                  {matches.length} match{matches.length !== 1 ? "es" : ""}
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
              {matches.length === 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1.5 bg-muted text-muted-foreground rounded-lg font-body text-xs">
                  <AlertCircle className="w-3 h-3" /> No matches
                </span>
              )}
              <button onClick={dismiss} title="Dismiss" disabled={confirming}
                className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {isConfirmed && txn.matched_label && (
            <span className="font-body text-xs text-green-800 max-w-[140px] truncate hidden lg:block" title={txn.matched_label}>
              ✓ {txn.matched_label}
            </span>
          )}
        </div>
      </div>

      {/* Expanded match options */}
      {expanded && !isConfirmed && !isDismissed && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-muted/20">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase mb-2">Suggested Matches</p>
          {matches.map((match, idx) => (
            <div key={match.id + idx}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selectedMatchId === match.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
              }`}
              onClick={() => setSelectedMatchId(match.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input type="radio" readOnly checked={selectedMatchId === match.id} className="shrink-0" />
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium truncate">{match.label}</p>
                  <p className="font-body text-xs text-muted-foreground">{match.type === "vendor_payment" ? "Vendor Payment" : "Invoice"} · {match.days} day(s) apart</p>
                </div>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full border text-xs font-semibold ${CONFIDENCE_STYLES[match.confidence]}`}>
                {match.confidence}
              </span>
            </div>
          ))}

          <button
            onClick={() => {
              const match = matches.find(m => m.id === selectedMatchId);
              if (match) confirm(match);
            }}
            disabled={confirming || !selectedMatchId}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm Match
          </button>
        </div>
      )}
    </div>
  );
}