import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Ticket, TrendingUp, Percent, DollarSign, Search } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DiscountCodeDashboard() {
  const [invites, setInvites] = useState([]);
  const [promotions, setPromotions] = useState({});
  const [loading, setLoading] = useState(true);
  const [promoFilter, setPromoFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, promos] = await Promise.all([
        base44.entities.EventInvite.list("-created_date", 500),
        base44.entities.EventPromotion.list("-created_date", 200),
      ]);
      const promoMap = {};
      promos.forEach((p) => { promoMap[p.id] = p; });
      setPromotions(promoMap);
      // Only invites carrying a unique discount code
      setInvites(all.filter((i) => i.discount_code));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const used = (i) => i.rsvp_status === "Attending";

  const filtered = invites.filter((i) => {
    const promoOk = promoFilter === "all" || i.promotion_id === promoFilter;
    const usageOk =
      usageFilter === "all" ||
      (usageFilter === "used" && used(i)) ||
      (usageFilter === "unused" && !used(i));
    const q = query.trim().toLowerCase();
    const queryOk =
      !q ||
      (i.guest_name || "").toLowerCase().includes(q) ||
      (i.guest_email || "").toLowerCase().includes(q) ||
      (i.discount_code || "").toLowerCase().includes(q);
    return promoOk && usageOk && queryOk;
  });

  const codesIssued = invites.length;
  const codesUsed = invites.filter(used).length;
  const redemptionRate = codesIssued ? Math.round((codesUsed / codesIssued) * 100) : 0;
  const issuedValue = invites.reduce((s, i) => s + Number(i.discount_amount || 0), 0);
  const usedValue = invites.filter(used).reduce((s, i) => s + Number(i.discount_amount || 0), 0);

  const promoOptions = Object.values(promotions).filter((p) =>
    invites.some((i) => i.promotion_id === p.id)
  );

  const stats = [
    { label: "Codes Issued", value: codesIssued, icon: Ticket, tone: "text-foreground" },
    { label: "Codes Used", value: codesUsed, icon: TrendingUp, tone: "text-green-600" },
    { label: "Redemption Rate", value: `${redemptionRate}%`, icon: Percent, tone: "text-primary" },
    { label: "Discount Redeemed", value: `$${usedValue.toFixed(2)}`, icon: DollarSign, tone: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.tone}`} />
            </div>
            <p className={`font-heading text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm bg-background font-body"
            placeholder="Search member, email, or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="border border-border rounded-lg px-3 py-1.5 text-xs bg-background font-body"
          value={promoFilter}
          onChange={(e) => setPromoFilter(e.target.value)}
        >
          <option value="all">All Promotions</option>
          {promoOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {["all", "used", "unused"].map((f) => (
            <button
              key={f}
              onClick={() => setUsageFilter(f)}
              className={`px-3 py-1 rounded-md font-body text-xs font-medium capitalize transition-all ${
                usageFilter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All Codes" : f}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg font-body text-xs hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Issued vs redeemed value bar */}
      {codesIssued > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-body text-sm font-semibold">Discount Value</span>
            <span className="font-body text-xs text-muted-foreground">
              ${usedValue.toFixed(2)} of ${issuedValue.toFixed(2)} redeemed
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${issuedValue ? (usedValue / issuedValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-body text-sm text-muted-foreground">
            {codesIssued === 0
              ? "No discount codes have been issued yet."
              : "No codes match this filter."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-2.5">Member</th>
                  <th className="text-left font-semibold px-4 py-2.5 hidden sm:table-cell">Promotion</th>
                  <th className="text-left font-semibold px-4 py-2.5">Code</th>
                  <th className="text-right font-semibold px-4 py-2.5">Discount</th>
                  <th className="text-left font-semibold px-4 py-2.5">Status</th>
                  <th className="text-left font-semibold px-4 py-2.5 hidden md:table-cell">Responded</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const isUsed = used(i);
                  const promo = promotions[i.promotion_id];
                  return (
                    <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{i.guest_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{i.guest_email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[180px] truncate">
                        {promo?.title || i.promotion_title || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{i.discount_code}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${Number(i.discount_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isUsed
                              ? "bg-green-50 text-green-700"
                              : i.rsvp_status === "Declined"
                                ? "bg-red-50 text-red-700"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isUsed ? "Used" : i.rsvp_status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {formatDate(i.rsvp_responded_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}