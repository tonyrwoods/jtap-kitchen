import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Search, Star, TrendingUp, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

const TIER_CONFIG = {
  Bronze:   { color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  min: 0 },
  Silver:   { color: "text-slate-600",  bg: "bg-slate-50",   border: "border-slate-200",  min: 500 },
  Gold:     { color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-200", min: 1500 },
  Platinum: { color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", min: 5000 },
};

const TIER_ORDER = ["Bronze", "Silver", "Gold", "Platinum"];

function calcTier(totalSpend) {
  let tier = "Bronze";
  for (const t of TIER_ORDER) {
    if (totalSpend >= TIER_CONFIG[t].min) tier = t;
  }
  return tier;
}

function nextTierInfo(tier, totalSpend) {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === TIER_ORDER.length - 1) return null;
  const next = TIER_ORDER[idx + 1];
  return { name: next, remaining: TIER_CONFIG[next].min - totalSpend };
}

export default function CustomerLoyaltyPanel({ onCustomerLinked, orderTotal }) {
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    const results = await base44.entities.CustomerProfile.filter({ email: email.trim().toLowerCase() }, "-created_date", 1);
    setSearching(false);
    if (results.length > 0) {
      setCustomer(results[0]);
      onCustomerLinked(results[0]);
    } else {
      setShowCreate(true);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    const profile = await base44.entities.CustomerProfile.create({
      name: newName.trim(),
      email: email.trim().toLowerCase(),
      phone: newPhone.trim(),
      total_visits: 0,
      total_spend: 0,
      loyalty_points: 0,
      loyalty_tier: "Bronze",
      order_history: [],
    });
    setCustomer(profile);
    onCustomerLinked(profile);
    setShowCreate(false);
    toast.success("Customer profile created!");
  };

  const handleClear = () => {
    setCustomer(null);
    setEmail("");
    setShowCreate(false);
    setNewName("");
    setNewPhone("");
    onCustomerLinked(null);
  };

  if (customer) {
    const tier = customer.loyalty_tier || "Bronze";
    const cfg = TIER_CONFIG[tier];
    const next = nextTierInfo(tier, customer.total_spend || 0);
    const pointsToEarn = orderTotal ? Math.floor(orderTotal) : 0;

    return (
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
              <User className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-foreground">{customer.name}</p>
              <p className="font-body text-xs text-muted-foreground">{customer.email}</p>
            </div>
          </div>
          <button onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tier badge */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.border} ${cfg.color} ${cfg.bg}`}>
            <Star className="w-3 h-3" /> {tier}
          </span>
          <span className="font-body text-xs text-muted-foreground">{customer.loyalty_points || 0} pts</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShoppingBag, label: "Visits", value: customer.total_visits || 0 },
            { icon: TrendingUp,  label: "Spent",  value: `$${(customer.total_spend || 0).toFixed(0)}` },
            { icon: Star,        label: "Points",  value: customer.loyalty_points || 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <p className="font-heading text-sm font-bold text-foreground">{value}</p>
              <p className="font-body text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Points to earn */}
        {pointsToEarn > 0 && (
          <p className="font-body text-xs text-center text-muted-foreground">
            +{pointsToEarn} pts will be earned on this order
          </p>
        )}

        {/* Next tier progress */}
        {next && (
          <div>
            <div className="flex justify-between font-body text-xs text-muted-foreground mb-1">
              <span>{tier}</span>
              <span>${next.remaining.toFixed(0)} to {next.name}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/60 border border-white overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.color.replace("text-", "bg-")}`}
                style={{ width: `${Math.min(100, 100 - (next.remaining / TIER_CONFIG[next.name].min) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-sm font-semibold">Customer Lookup</h3>
      </div>

      {!showCreate ? (
        <div className="flex gap-2">
          <input
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !email.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-body disabled:opacity-50"
          >
            {searching ? "…" : <Search className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-body text-xs text-muted-foreground">No profile found for <strong>{email}</strong>. Create one?</p>
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            placeholder="Full name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            placeholder="Phone (optional)"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 py-2 bg-primary text-primary-foreground rounded-full text-xs font-body font-semibold">Create Profile</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-border rounded-full text-xs font-body">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}