import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Upload, Filter, Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { autoMatch } from "../components/reconciliation/useAutoMatch";
import ImportTransactionsModal from "../components/reconciliation/ImportTransactionsModal";
import TransactionRow from "../components/reconciliation/TransactionRow";
import ReconciliationSummaryBar from "../components/reconciliation/ReconciliationSummaryBar";

const STATUS_FILTERS = ["All", "Unmatched", "Auto-Matched", "Confirmed", "Dismissed"];

export default function ReconciliationCenter() {
  const [transactions, setTransactions] = useState([]);
  const [matchedData, setMatchedData] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [autoRunning, setAutoRunning] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [txns, methods, pmts, invs] = await Promise.all([
      base44.entities.BankTransaction.list("-transaction_date", 500),
      base44.entities.PaymentMethod.filter({ is_active: true }),
      base44.entities.VendorPayment.list("-created_date", 500),
      base44.entities.Invoice.filter({ is_vendor_invoice: true }),
    ]);
    setTransactions(txns);
    setPaymentMethods(methods);
    setVendorPayments(pmts);
    setInvoices(invs);
    setMatchedData(autoMatch(txns, pmts, invs));
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Run auto-matching and update statuses for "Unmatched" transactions that have matches
  const runAutoMatch = async () => {
    setAutoRunning(true);
    const unmatched = transactions.filter(t => t.reconciliation_status === "Unmatched");
    const matchResults = autoMatch(unmatched, vendorPayments, invoices);
    let updated = 0;
    for (const { txn, matches } of matchResults) {
      if (matches.length > 0) {
        await base44.entities.BankTransaction.update(txn.id, {
          reconciliation_status: "Auto-Matched",
          matched_to: matches[0].type,
          matched_id: matches[0].id,
          matched_label: matches[0].label,
          match_confidence: matches[0].confidence,
        });
        updated++;
      }
    }
    toast.success(`Auto-match complete: ${updated} transaction(s) flagged for review`);
    setAutoRunning(false);
    loadAll();
  };

  const clearDismissed = async () => {
    const dismissed = transactions.filter(t => t.reconciliation_status === "Dismissed");
    await Promise.all(dismissed.map(t => base44.entities.BankTransaction.delete(t.id)));
    toast.success(`${dismissed.length} dismissed transaction(s) cleared`);
    loadAll();
  };

  // Apply filters
  const filteredData = matchedData.filter(({ txn }) => {
    const statusOk = statusFilter === "All" || txn.reconciliation_status === statusFilter;
    const accountOk = accountFilter === "All" || txn.payment_method_id === accountFilter;
    return statusOk && accountOk;
  });

  const dismissedCount = transactions.filter(t => t.reconciliation_status === "Dismissed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-xl font-bold">Reconciliation Center</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Match bank transactions to vendor payments & invoices</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={runAutoMatch} disabled={autoRunning || loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
            <Zap className="w-4 h-4" /> {autoRunning ? "Running..." : "Run Auto-Match"}
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-body text-sm font-medium hover:opacity-90">
            <Upload className="w-4 h-4" /> Import Transactions
          </button>
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full font-body text-sm hover:bg-muted transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Summary */}
        <ReconciliationSummaryBar transactions={transactions} />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {STATUS_FILTERS.map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md font-body text-xs font-medium transition-all ${statusFilter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {paymentMethods.length > 0 && (
            <select
              className="border border-border rounded-lg px-3 py-1.5 text-xs bg-background font-body"
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
            >
              <option value="All">All Accounts</option>
              {paymentMethods.map(m => (
                <option key={m.id} value={m.id}>{m.nickname} ···· {m.account_last4}</option>
              ))}
            </select>
          )}

          {dismissedCount > 0 && (
            <button onClick={clearDismissed}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg font-body text-xs font-semibold hover:bg-red-50 transition-colors ml-auto">
              <Trash2 className="w-3 h-3" /> Clear {dismissedCount} Dismissed
            </button>
          )}
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
            <p className="font-body text-muted-foreground mb-2">
              {transactions.length === 0 ? "No transactions imported yet." : "No transactions match this filter."}
            </p>
            {transactions.length === 0 && (
              <button onClick={() => setShowImport(true)} className="font-body text-sm text-primary hover:underline">
                Import your first transactions →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 font-body text-xs text-muted-foreground font-semibold uppercase tracking-wide hidden sm:flex">
              <div className="w-24 shrink-0">Date</div>
              <div className="flex-1">Description</div>
              <div className="w-24 shrink-0 text-right">Amount</div>
              <div className="w-28 shrink-0">Status</div>
              <div className="w-36 shrink-0">Action</div>
            </div>
            {filteredData.map(txnData => (
              <TransactionRow key={txnData.txn.id} txnData={txnData} onUpdated={loadAll} />
            ))}
          </div>
        )}
      </div>

      {showImport && paymentMethods.length > 0 && (
        <ImportTransactionsModal
          paymentMethods={paymentMethods}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); loadAll(); }}
        />
      )}
      {showImport && paymentMethods.length === 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="font-body text-sm">You must link a payment method first before importing transactions.</p>
            <div className="flex gap-3">
              <a href="/admin" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm text-center">Go to Vendor Payments</a>
              <button onClick={() => setShowImport(false)} className="flex-1 px-4 py-2 border border-border rounded-full font-body text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}