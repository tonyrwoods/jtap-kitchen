import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Filter, X } from "lucide-react";
import { toast } from "sonner";

export default function AuditReportTab() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVendor, setFilterVendor] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 1000).then((logs) => {
      setAuditLogs(logs);
      setLoading(false);
    });
  }, []);

  const actions = [
    "Invoice Created",
    "Approval Request",
    "Invoice Approved",
    "Invoice Rejected",
    "Payment Plan Created",
    "Payment Recorded",
    "Payment Status Updated",
    "Reconciliation Flagged",
    "Discrepancy Noted",
    "Document Attached",
    "Document Removed",
    "Invoice Voided",
  ];

  const vendors = [...new Set(auditLogs.map((log) => log.vendor_name))];

  const filtered = auditLogs.filter((log) => {
    if (filterVendor && log.vendor_name !== filterVendor) return false;
    if (filterAction && log.action !== filterAction) return false;
    
    if (filterStartDate) {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      if (logDate < filterStartDate) return false;
    }
    
    if (filterEndDate) {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      if (logDate > filterEndDate) return false;
    }
    
    return true;
  });

  const exportCSV = () => {
    const headers = [
      "Invoice ID",
      "Vendor Name",
      "Action",
      "Details",
      "Admin Email",
      "Timestamp",
    ];

    const rows = filtered.map((log) => [
      log.invoice_id,
      log.vendor_name,
      log.action,
      log.details || "",
      log.admin_email,
      new Date(log.timestamp).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Audit report exported");
  };

  const clearFilters = () => {
    setFilterVendor("");
    setFilterAction("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Audit Report</h3>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <p className="font-body text-sm font-semibold text-foreground">Filters</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
              Vendor
            </label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              <option value="">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
              From Date
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>

          <div>
            <label className="font-body text-xs text-muted-foreground mb-1.5 block uppercase font-semibold">
              To Date
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
          </div>
        </div>

        {(filterVendor || filterAction || filterStartDate || filterEndDate) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors font-body"
          >
            <X className="w-3 h-3" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <p className="font-body text-muted-foreground">No audit logs found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Timestamp
                  </th>
                  <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Vendor
                  </th>
                  <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Action
                  </th>
                  <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Details
                  </th>
                  <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-body text-sm text-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-body text-sm font-medium">{log.vendor_name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-body text-sm text-muted-foreground">{log.details || "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-body text-xs text-muted-foreground">{log.admin_email}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((log) => (
              <div key={log.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-body text-xs text-muted-foreground mb-1">Timestamp</p>
                    <p className="font-body text-sm font-medium">{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="font-body text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
                    {log.action}
                  </span>
                </div>
                <div className="border-t border-border pt-2 space-y-2">
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Vendor</p>
                    <p className="font-body text-sm font-medium">{log.vendor_name}</p>
                  </div>
                  {log.details && (
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-1">Details</p>
                      <p className="font-body text-sm text-muted-foreground">{log.details}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-1">Admin</p>
                    <p className="font-body text-xs text-muted-foreground">{log.admin_email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="font-body text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {auditLogs.length} records
      </p>
    </div>
  );
}