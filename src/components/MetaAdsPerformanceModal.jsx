import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, RefreshCw, DollarSign, MousePointerClick, Eye, ShoppingCart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

function fmtMoney(n) {
  return `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtNum(n) {
  return (n || 0).toLocaleString();
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-body text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="font-body text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const STATUS_STYLES = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700",
  DELETED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export default function MetaAdsPerformanceModal({ onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.MetaAdsInsight.list("-spend", 50);
      setRows(data || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncMetaAdsInsights", {});
      if (res.data?.success) {
        toast.success(`Synced ${res.data.synced} campaign${res.data.synced === 1 ? "" : "s"}`);
        await load();
      } else {
        toast.error(res.data?.error || "Sync failed");
      }
    } catch {
      toast.error("Sync failed — is the Meta Ads account still connected?");
    }
    setSyncing(false);
  };

  const totalSpend = rows.reduce((s, r) => s + (r.spend || 0), 0);
  const totalClicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);
  const totalImpr = rows.reduce((s, r) => s + (r.impressions || 0), 0);
  const totalResults = rows.reduce((s, r) => s + (r.results || 0), 0);
  const totalPurchaseValue = rows.reduce((s, r) => s + (r.purchase_value || 0), 0);
  const avgRoas = totalSpend > 0 ? (totalPurchaseValue / totalSpend).toFixed(2) : "0.00";
  const avgCtr = totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(2) : "0.00";
  const lastSynced = rows[0]?.synced_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-heading text-lg font-bold">Meta Ads Performance</h2>
              <p className="font-body text-xs text-muted-foreground">
                Campaign performance · last 30 days
                {lastSynced && ` · synced ${new Date(lastSynced).toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground mb-1">No campaign data yet.</p>
              <p className="font-body text-xs text-muted-foreground">Click <strong>Sync Now</strong> to pull performance from your connected Meta Ads account.</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard icon={DollarSign} label="Ad Spend" value={fmtMoney(totalSpend)} sub="last 30 days" />
                <StatCard icon={ShoppingCart} label="Conversions" value={fmtNum(totalResults)} sub={fmtMoney(totalPurchaseValue) + " revenue"} />
                <StatCard icon={TrendingUp} label="Avg ROAS" value={`${avgRoas}×`} sub="return on ad spend" />
                <StatCard icon={MousePointerClick} label="Clicks" value={fmtNum(totalClicks)} sub={`${avgCtr}% CTR`} />
                <StatCard icon={Eye} label="Impressions" value={fmtNum(totalImpr)} sub={fmtNum(rows.reduce((s, r) => s + (r.reach || 0), 0)) + " reach"} />
                <StatCard icon={DollarSign} label="Avg CPC" value={totalClicks > 0 ? fmtMoney(totalSpend / totalClicks) : "—"} sub="cost per click" />
              </div>

              {/* Campaign table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      {["Campaign", "Status", "Spend", "Clicks", "CTR", "Conversions", "Revenue", "ROAS"].map(h => (
                        <th key={h} className="px-3 py-2.5 font-body text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id || i} className="border-t border-border">
                        <td className="px-3 py-2.5">
                          <p className="font-body font-medium text-foreground leading-tight">{r.campaign_name || "Unnamed"}</p>
                          <p className="font-body text-xs text-muted-foreground">{r.account_name || r.account_id}{r.objective ? ` · ${r.objective}` : ""}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-body font-medium ${STATUS_STYLES[r.campaign_status] || "bg-muted text-muted-foreground"}`}>
                            {r.campaign_status || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-body text-foreground">{fmtMoney(r.spend)}</td>
                        <td className="px-3 py-2.5 font-body text-foreground">{fmtNum(r.clicks)}</td>
                        <td className="px-3 py-2.5 font-body text-muted-foreground">{(r.ctr || 0).toFixed(2)}%</td>
                        <td className="px-3 py-2.5 font-body text-foreground">{fmtNum(r.results)}</td>
                        <td className="px-3 py-2.5 font-body text-foreground">{fmtMoney(r.purchase_value)}</td>
                        <td className="px-3 py-2.5 font-body font-semibold" style={{ color: (r.roas || 0) >= 1 ? "#16a34a" : "#dc2626" }}>
                          {(r.roas || 0).toFixed(2)}×
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                Window: {rows[0]?.date_start || "—"} → {rows[0]?.date_stop || "—"}. Data is read-only reporting from the Meta Graph API.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}