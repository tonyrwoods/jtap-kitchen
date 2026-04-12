import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Gift, TrendingUp, Receipt, ChevronRight, Award, CheckCircle, Search, ArrowRight, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const POINTS_PER_DOLLAR = 10;

function pts(spending) {
  return Math.floor((spending || 0) * POINTS_PER_DOLLAR);
}

// ── Tier Badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier, size = "md" }) {
  if (!tier) return null;
  const sz = size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-body font-semibold ${sz}`}
      style={{ backgroundColor: tier.color + "22", color: tier.color, border: `1px solid ${tier.color}55` }}
    >
      {tier.badge_emoji} {tier.name}
    </span>
  );
}

// ── Points Ring ──────────────────────────────────────────────────────────────
function PointsRing({ current, next, points }) {
  const pct = next ? Math.min(100, (current / next) * 100) : 100;
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="text-center">
        <p className="font-heading text-2xl font-bold text-foreground">{points.toLocaleString()}</p>
        <p className="font-body text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );
}

// ── Lookup Screen ────────────────────────────────────────────────────────────
function LookupScreen({ onFound }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    const results = await base44.entities.LoyaltyMember.filter({ email: email.trim().toLowerCase() }, "-created_date", 1);
    if (results.length === 0) {
      setNotFound(true);
    } else {
      onFound(results[0]);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto pt-16 px-4">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2">JTAP Rewards</h1>
        <p className="font-body text-muted-foreground">Check your points, track rewards, and see your dining history.</p>
      </div>

      {/* Lookup */}
      <form onSubmit={handleLookup} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <label className="font-body text-sm font-medium block">Enter your email address</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => { setEmail(e.target.value); setNotFound(false); }}
          placeholder="you@example.com"
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {notFound && (
          <p className="font-body text-xs text-destructive flex items-center gap-1.5">
            No loyalty account found for this email. Ask your server to enroll you!
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> Look Up My Account</>}
        </button>
      </form>

      {/* How it works */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[
          { icon: Utensils, label: "Dine with us",      desc: "Every visit earns points" },
          { icon: Star,     label: "Earn 10 pts / $1",  desc: "Auto-credited on purchase" },
          { icon: Gift,     label: "Redeem rewards",    desc: "Unlock perks as you level up" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="space-y-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="font-body text-xs font-semibold">{label}</p>
            <p className="font-body text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Claim Receipt Modal ──────────────────────────────────────────────────────
function ClaimModal({ member, tiers, onClose, onClaimed }) {
  const [receiptNo, setReceiptNo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClaim = async (e) => {
    e.preventDefault();
    setLoading(true);
    const results = await base44.entities.Invoice.filter({ receipt_number: receiptNo.trim().toUpperCase(), status: "Paid" }, "-created_date", 1);
    if (results.length === 0) {
      toast.error("Receipt not found or already processed.");
      setLoading(false);
      return;
    }
    const invoice = results[0];

    // Credit points: update member spending + visit
    const newSpending = (member.total_spending || 0) + invoice.total;
    const newVisits   = (member.total_visits || 0) + 1;

    // Determine new tier
    const eligible = tiers
      .filter(t => t.is_active && newVisits >= (t.min_visits || 0) && newSpending >= (t.min_spending || 0))
      .sort((a, b) => b.min_spending - a.min_spending);
    const newTier = eligible[0] || null;

    await base44.entities.LoyaltyMember.update(member.id, {
      total_spending: newSpending,
      total_visits: newVisits,
      tier_id:   newTier?.id   || member.tier_id,
      tier_name: newTier?.name || member.tier_name,
    });

    // Mark invoice as linked (add note)
    await base44.entities.Invoice.update(invoice.id, {
      notes: (invoice.notes ? invoice.notes + " | " : "") + `Loyalty credited: ${member.email}`,
    });

    toast.success(`+${pts(invoice.total)} points credited!`);
    onClaimed();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading text-lg font-semibold">Claim a Receipt</h3>
        <p className="font-body text-sm text-muted-foreground">Enter your receipt number to credit points from a recent purchase.</p>
        <form onSubmit={handleClaim} className="space-y-3">
          <input
            required
            value={receiptNo}
            onChange={e => setReceiptNo(e.target.value)}
            placeholder="e.g. RCP-L8K3J2"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Crediting…" : "Credit Points"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ member: initialMember, tiers, onSignOut }) {
  const [member, setMember] = useState(initialMember);
  const [invoices, setInvoices] = useState([]);
  const [showClaim, setShowClaim] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const currentTier  = tiers.find(t => t.id === member.tier_id) || null;
  const points       = pts(member.total_spending);

  // Next tier
  const nextTier = tiers
    .filter(t => t.is_active && (t.min_spending > (member.total_spending || 0) || t.min_visits > (member.total_visits || 0)))
    .sort((a, b) => a.min_spending - b.min_spending)[0] || null;

  const progressToNext = nextTier
    ? Math.min(100, ((member.total_spending || 0) / nextTier.min_spending) * 100)
    : 100;

  useEffect(() => {
    // Load invoices that mention this member's email in notes
    base44.entities.Invoice.filter({ status: "Paid" }, "-created_date", 50)
      .then(all => {
        const mine = all.filter(inv => inv.notes?.includes(member.email));
        setInvoices(mine);
        setLoadingInvoices(false);
      });
  }, [member.id]);

  const refresh = async () => {
    const updated = await base44.entities.LoyaltyMember.filter({ email: member.email }, "-created_date", 1);
    if (updated.length) setMember(updated[0]);
    const all = await base44.entities.Invoice.filter({ status: "Paid" }, "-created_date", 50);
    setInvoices(all.filter(inv => inv.notes?.includes(member.email)));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Welcome back{member.guest_name ? `, ${member.guest_name.split(" ")[0]}` : ""}!</h1>
          <p className="font-body text-sm text-muted-foreground">{member.email}</p>
        </div>
        <button onClick={onSignOut} className="font-body text-sm text-muted-foreground hover:text-foreground">Sign out</button>
      </div>

      {/* Points Card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="space-y-3">
            <TierBadge tier={currentTier} size="lg" />
            <div>
              <p className="font-body text-sm text-muted-foreground">{member.total_visits || 0} visits · ${(member.total_spending || 0).toFixed(2)} spent</p>
            </div>
            {nextTier && (
              <div className="space-y-1.5">
                <p className="font-body text-xs text-muted-foreground">
                  ${(nextTier.min_spending - (member.total_spending || 0)).toFixed(2)} more to <strong>{nextTier.name}</strong>
                </p>
                <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressToNext}%` }} />
                </div>
              </div>
            )}
            {!nextTier && <p className="font-body text-xs text-green-700 font-semibold">🏆 You're at the top tier!</p>}
          </div>
          <PointsRing current={member.total_spending || 0} next={nextTier?.min_spending} points={points} />
        </div>

        <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
          <p className="font-body text-xs text-muted-foreground">Have a receipt? Claim your points.</p>
          <button
            onClick={() => setShowClaim(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-xs font-medium hover:opacity-90"
          >
            <Receipt className="w-3.5 h-3.5" /> Claim Receipt
          </button>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Available Rewards</h2>
        <div className="space-y-3">
          {tiers.filter(t => t.is_active).sort((a, b) => a.min_spending - b.min_spending).map(tier => {
            const unlocked = currentTier && (tier.min_spending <= (currentTier?.min_spending || 0)) || tier.id === member.tier_id;
            return (
              <div key={tier.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${unlocked ? "border-border bg-card" : "border-dashed border-muted-foreground/30 bg-muted/20 opacity-60"}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: tier.color + "22" }}>
                  {tier.badge_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-sm font-semibold">{tier.name}</p>
                    {unlocked && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                  </div>
                  {tier.discount_percent > 0 && (
                    <p className="font-body text-xs text-primary font-medium">{tier.discount_percent}% discount on every visit</p>
                  )}
                  {tier.perks && <p className="font-body text-xs text-muted-foreground">{tier.perks}</p>}
                  {!unlocked && (
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      Requires ${tier.min_spending} spent · {tier.min_visits} visits
                    </p>
                  )}
                </div>
                {unlocked
                  ? <span className="text-xs font-body font-semibold text-green-700 shrink-0">Unlocked</span>
                  : <span className="text-xs font-body text-muted-foreground shrink-0">Locked</span>}
              </div>
            );
          })}
          {tiers.filter(t => t.is_active).length === 0 && (
            <p className="font-body text-sm text-muted-foreground">No rewards configured yet.</p>
          )}
        </div>
      </div>

      {/* Order History */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Receipt History</h2>
        {loadingInvoices ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="font-body text-sm text-muted-foreground">No claimed receipts yet.</p>
            <p className="font-body text-xs text-muted-foreground mt-1">Claim a receipt above to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                <div>
                  <p className="font-body text-sm font-medium">{inv.receipt_number}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Table {inv.table_number}
                    {inv.server_name ? ` · ${inv.server_name}` : ""}
                    {" · "}{new Date(inv.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-sm font-bold">${inv.total.toFixed(2)}</p>
                  <p className="font-body text-xs text-primary">+{pts(inv.total)} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showClaim && (
        <ClaimModal
          member={member}
          tiers={tiers}
          onClose={() => setShowClaim(false)}
          onClaimed={refresh}
        />
      )}
    </motion.div>
  );
}

// ── Page Root ────────────────────────────────────────────────────────────────
export default function LoyaltyPortal() {
  const [member, setMember] = useState(null);
  const [tiers, setTiers]   = useState([]);

  useEffect(() => {
    base44.entities.LoyaltyTier.filter({ is_active: true }, "min_spending", 50).then(setTiers);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-heading text-lg font-bold text-primary">JTAP Kitchen</a>
        <a href="/loyalty" className="font-body text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
          <Gift className="w-3.5 h-3.5" /> Loyalty Portal
        </a>
      </div>

      <AnimatePresence mode="wait">
        {!member ? (
          <LookupScreen key="lookup" onFound={setMember} />
        ) : (
          <Dashboard key="dashboard" member={member} tiers={tiers} onSignOut={() => setMember(null)} />
        )}
      </AnimatePresence>

      <div className="text-center py-8 font-body text-xs text-muted-foreground">
        {POINTS_PER_DOLLAR} points per $1 spent · Tiers update automatically
      </div>
    </div>
  );
}