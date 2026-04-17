import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CSV_TEMPLATE = `transaction_date,description,amount,transaction_type,reference_number
2026-04-01,SYSCO FOODS LLC,-1200.00,Debit,CHK1042
2026-04-03,METRO PRODUCE INC,-450.00,Debit,CHK1043
2026-04-05,DEPOSIT,5000.00,Credit,DEP001
`;

export default function ImportTransactionsModal({ paymentMethods, onClose, onImported }) {
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0]?.id || "");
  const [rows, setRows] = useState([]);
  const [manualRow, setManualRow] = useState({ transaction_date: "", description: "", amount: "", transaction_type: "Debit", reference_number: "" });
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState("manual"); // "manual" | "csv"

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => obj[h] = vals[i] || "");
      return obj;
    }).filter(r => r.transaction_date && r.amount);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions_template.csv";
    a.click();
  };

  const addManualRow = () => {
    if (!manualRow.transaction_date || !manualRow.amount) {
      toast.error("Date and amount are required");
      return;
    }
    setRows(prev => [...prev, { ...manualRow }]);
    setManualRow({ transaction_date: "", description: "", amount: "", transaction_type: "Debit", reference_number: "" });
  };

  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleImport = async () => {
    if (!selectedMethod || rows.length === 0) {
      toast.error("Select an account and add at least one transaction");
      return;
    }
    setImporting(true);
    const method = paymentMethods.find(m => m.id === selectedMethod);
    const label = method ? `${method.nickname} (${method.bank_name} ···· ${method.account_last4})` : "";
    const records = rows.map(r => ({
      payment_method_id: selectedMethod,
      payment_method_label: label,
      transaction_date: r.transaction_date,
      description: r.description || "",
      amount: Math.abs(parseFloat(r.amount) || 0),
      transaction_type: r.transaction_type === "Credit" ? "Credit" : "Debit",
      reference_number: r.reference_number || "",
      reconciliation_status: "Unmatched",
      matched_to: "unmatched",
    }));
    await base44.entities.BankTransaction.bulkCreate(records);
    toast.success(`${records.length} transaction(s) imported`);
    setImporting(false);
    onImported();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full space-y-5 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Import Transactions</h3>
          <button onClick={onClose} className="p-1 hover:text-destructive transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Account selector */}
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Account *</label>
          <select
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
          >
            {paymentMethods.map(m => (
              <option key={m.id} value={m.id}>{m.nickname} — {m.bank_name} ···· {m.account_last4}</option>
            ))}
          </select>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
          {["manual", "csv"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md font-body text-sm font-medium transition-all ${mode === m ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {m === "manual" ? "Manual Entry" : "CSV Upload"}
            </button>
          ))}
        </div>

        {mode === "manual" && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-muted/30 rounded-xl p-3">
            <div className="sm:col-span-1">
              <label className="font-body text-xs text-muted-foreground mb-1 block">Date</label>
              <input type="date" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body"
                value={manualRow.transaction_date}
                onChange={e => setManualRow(p => ({ ...p, transaction_date: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-xs text-muted-foreground mb-1 block">Description</label>
              <input type="text" placeholder="Vendor name or memo" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body"
                value={manualRow.description}
                onChange={e => setManualRow(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Amount ($)</label>
              <input type="number" step="0.01" placeholder="0.00" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body"
                value={manualRow.amount}
                onChange={e => setManualRow(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Type</label>
              <select className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body"
                value={manualRow.transaction_type}
                onChange={e => setManualRow(p => ({ ...p, transaction_type: e.target.value }))}>
                <option>Debit</option>
                <option>Credit</option>
              </select>
            </div>
            <button onClick={addManualRow} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-body text-xs font-semibold">
              + Add
            </button>
          </div>
        )}

        {mode === "csv" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-body text-sm font-medium cursor-pointer hover:opacity-90">
                <Upload className="w-4 h-4" /> Upload CSV
                <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </label>
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border border-border rounded-full font-body text-sm hover:bg-muted transition-colors">
                <FileText className="w-4 h-4" /> Download Template
              </button>
            </div>
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Columns: transaction_date, description, amount (negative = debit), transaction_type, reference_number
            </p>
          </div>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/40 px-4 py-2 flex items-center justify-between">
              <p className="font-body text-xs font-semibold text-muted-foreground uppercase">{rows.length} transaction(s) ready</p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs font-body">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/10">
                      <td className="px-3 py-2">{r.transaction_date}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{r.description}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${r.transaction_type === "Credit" ? "text-green-700" : "text-red-700"}`}>
                        {r.transaction_type === "Credit" ? "+" : "-"}${Math.abs(parseFloat(r.amount) || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">{r.transaction_type}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleImport} disabled={importing || rows.length === 0 || !selectedMethod}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
            {importing ? "Importing..." : `Import ${rows.length} Transaction(s)`}
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}