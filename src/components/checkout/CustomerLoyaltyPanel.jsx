import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Search, Star, TrendingUp, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

// TapRoomMember tiers (the live JTAP Room Society model).
const TIER_CONFIG = {
  "Regular":         { color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
  "Tap Member":      { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  "Reserve Member":  { color: "text-slate-700",   bg: "bg-slate-100",  border: "border-slate-300" },
  "Founding Member": { color: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-200" },
};

export default function CustomerLoyaltyPanel({ onCustomerLinked, orderTotal }) {
  const [email, setEmail] = useState("");
  const [member, setMember] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    const results = await base44.entities.TapRoomMember.filter({ email: email.trim().toLowerCase() }, "-created_date", 1);
    setSearching(false);
    if (results.length > 0) {
      setMember(results[0]);
      onCustomerLinked(results[0]);
    } else {
      setShowCreate(true);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    const res = await base44.functions.invoke("createCustomerProfile", {
      name: newName.trim(),
      email: email.trim().toLowerCase(),
      phone: newPhone.trim(),
    });
    if (res.data?.success) {
      setMember(res.data.profile);
      onCustomerLinked(res.data.profile);
      setShowCreate(false);
      toast.success("Member profile created!");
    } else {
      toast.error(res.data?.error || "Unable to create profile.");
    }
  };

  const handleClear = () => {
    setMember(null);
    setEmail("");
    setShowCreate(false);
    setNewName("");
    setNewPhone("");
    onCustomerLinked(null);
  };

  if (member) {
    const tier = member.tier || "Regular";
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG["Regular"];
    const pointsToEarn = orderTotal ? Math.floor(orderTotal) : 0;

    return (
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
              <User className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-foreground">{member.guest_name}</p>
              <p className="font-body text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            aria-label="Clear member selection"
            className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tier badge */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.border} ${cfg.color} ${cfg.bg}`}>
            <Star className="w-3 h-3" /> {tier}
          </span>
          <span className="font-body text-xs text-muted-foreground">{member.points_balance || 0} pts</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShoppingBag, label: "Visits", value: member.total_visits || 0 },
            { icon: TrendingUp,  label: "Spent",  value: `$${(member.total_spend || 0).toFixed(0)}` },
            { icon: Star,        label: "Points", value: member.points_balance || 0 },
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
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-sm font-semibold">Member Lookup</h3>
      </div>

      {!showCreate ? (
        <div className="flex gap-2">
          <input
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            placeholder="Member email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !email.trim()}
            aria-label="Search member by email"
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-body disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {searching ? "…" : <Search className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-body text-xs text-muted-foreground">No member found for <strong>{email}</strong>. Add them as a Regular member?</p>
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
            <button onClick={handleCreate} className="flex-1 py-2 bg-primary text-primary-foreground rounded-full text-xs font-body font-semibold">Add Member</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-border rounded-full text-xs font-body">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}