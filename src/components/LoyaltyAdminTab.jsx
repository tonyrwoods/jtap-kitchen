import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Crown, Users, Star } from "lucide-react";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white" /></div>
      <div>
        <p className="font-body text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function TierBadge({ tier }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: tier?.color || "#888" }}>
      {tier?.badge_emoji} {tier?.name}
    </span>
  );
}

function TierForm({ tier, onSave, onCancel }) {
  const [form, setForm] = useState(tier || { name: "", color: "#C89B4F", min_visits: 0, min_spending: 0, discount_percent: 0, perks: "", badge_emoji: "⭐", is_active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tier?.id) {
      await base44.entities.LoyaltyTier.update(tier.id, form);
    } else {
      await base44.entities.LoyaltyTier.create(form);
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-base font-semibold">{tier?.id ? "Edit" : "New"} Tier</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Tier Name *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Emoji Badge</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.badge_emoji} onChange={e => set("badge_emoji", e.target.value)} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Color</label>
          <div className="flex items-center gap-2">
            <input type="color" className="w-10 h-9 border border-border rounded-lg cursor-pointer" value={form.color} onChange={e => set("color", e.target.value)} />
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.color} onChange={e => set("color", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Min Visits</label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.min_visits} onChange={e => set("min_visits", +e.target.value)} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Min Spending ($)</label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.min_spending} onChange={e => set("min_spending", +e.target.value)} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Discount (%)</label>
          <input type="number" min="0" max="100" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.discount_percent} onChange={e => set("discount_percent", +e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <label className="font-body text-xs text-muted-foreground mb-1 block">Perks Description</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="e.g. Priority reservations, complimentary dessert, early event access" value={form.perks} onChange={e => set("perks", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save Tier</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

function MemberForm({ member, tiers, onSave, onCancel }) {
  const [form, setForm] = useState(member || { guest_name: "", email: "", phone: "", total_visits: 0, total_spending: 0, tier_id: "", tier_name: "", notes: "", joined_date: new Date().toISOString().slice(0, 10) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTierChange = (tierId) => {
    const tier = tiers.find(t => t.id === tierId);
    set("tier_id", tierId);
    set("tier_name", tier?.name || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (member?.id) {
      await base44.entities.LoyaltyMember.update(member.id, form);
    } else {
      await base44.entities.LoyaltyMember.create(form);
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-base font-semibold">{member?.id ? "Edit" : "Add"} Member</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Guest Name *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.guest_name} onChange={e => set("guest_name", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Email *</label>
          <input type="email" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.email} onChange={e => set("email", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Phone</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Loyalty Tier</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.tier_id} onChange={e => handleTierChange(e.target.value)}>
            <option value="">— No Tier —</option>
            {tiers.map(t => <option key={t.id} value={t.id}>{t.badge_emoji} {t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Total Visits</label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.total_visits} onChange={e => set("total_visits", +e.target.value)} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Total Spending ($)</label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.total_spending} onChange={e => set("total_spending", +e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-xs text-muted-foreground mb-1 block">Notes</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save Member</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function LoyaltyAdminTab() {
  const [tiers, setTiers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("members"); // members | tiers
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const load = async () => {
    const [t, m] = await Promise.all([
      base44.entities.LoyaltyTier.list("-created_date", 50),
      base44.entities.LoyaltyMember.list("-created_date", 100),
    ]);
    setTiers(t);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getTier = (tierId) => tiers.find(t => t.id === tierId);

  const deleteTier = async (id) => {
    await base44.entities.LoyaltyTier.delete(id);
    setTiers(prev => prev.filter(t => t.id !== id));
    toast.success("Tier deleted.");
  };

  const deleteMember = async (id) => {
    await base44.entities.LoyaltyMember.delete(id);
    setMembers(prev => prev.filter(m => m.id !== id));
    toast.success("Member removed.");
  };

  const autoAssignTier = async (member) => {
    const sorted = [...tiers].sort((a, b) => (b.min_visits + b.min_spending) - (a.min_visits + a.min_spending));
    const matched = sorted.find(t =>
      member.total_visits >= (t.min_visits || 0) && member.total_spending >= (t.min_spending || 0)
    );
    if (!matched) { toast("No tier matches this member's stats."); return; }
    await base44.entities.LoyaltyMember.update(member.id, { tier_id: matched.id, tier_name: matched.name });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, tier_id: matched.id, tier_name: matched.name } : m));
    toast.success(`Assigned to ${matched.badge_emoji} ${matched.name}`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Members" value={members.length} color="bg-primary" />
        <StatCard icon={Crown} label="Tiers Defined" value={tiers.length} color="bg-purple-500" />
        <StatCard icon={Star} label="Tiered Members" value={members.filter(m => m.tier_id).length} color="bg-amber-500" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border">
        {["members", "tiers"].map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2 font-body text-sm font-medium border-b-2 -mb-px capitalize transition-all ${subTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "members" ? "Members" : "Tier Settings"}
          </button>
        ))}
      </div>

      {/* Members */}
      {subTab === "members" && (
        <div className="space-y-4">
          {!showMemberForm && (
            <button onClick={() => { setEditingMember(null); setShowMemberForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Member
            </button>
          )}
          {showMemberForm && (
            <MemberForm member={editingMember} tiers={tiers} onSave={() => { setShowMemberForm(false); setEditingMember(null); load(); }} onCancel={() => { setShowMemberForm(false); setEditingMember(null); }} />
          )}
          {members.length === 0 && !showMemberForm && (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-muted-foreground">No loyalty members yet. Add your first member above.</p>
            </div>
          )}
          {members.map(m => {
            const tier = getTier(m.tier_id);
            return (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-body font-semibold">{m.guest_name}</p>
                    {tier ? <TierBadge tier={tier} /> : <span className="text-xs text-muted-foreground px-2 py-0.5 border border-border rounded-full">No Tier</span>}
                  </div>
                  <p className="font-body text-sm text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="font-body text-xs text-muted-foreground">🍽 {m.total_visits || 0} visits</span>
                    <span className="font-body text-xs text-muted-foreground">💰 ${(m.total_spending || 0).toFixed(2)} spent</span>
                    {m.notes && <span className="font-body text-xs text-muted-foreground italic truncate">"{m.notes}"</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tiers.length > 0 && (
                    <button onClick={() => autoAssignTier(m)} className="px-3 py-1.5 border border-border rounded-lg font-body text-xs hover:bg-muted transition-colors">
                      Auto-Assign
                    </button>
                  )}
                  <button onClick={() => { setEditingMember(m); setShowMemberForm(true); }} className="p-1.5 hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteMember(m.id)} className="p-1.5 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tiers */}
      {subTab === "tiers" && (
        <div className="space-y-4">
          {!showTierForm && (
            <button onClick={() => { setEditingTier(null); setShowTierForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Tier
            </button>
          )}
          {showTierForm && (
            <TierForm tier={editingTier} onSave={() => { setShowTierForm(false); setEditingTier(null); load(); }} onCancel={() => { setShowTierForm(false); setEditingTier(null); }} />
          )}
          {tiers.length === 0 && !showTierForm && (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-muted-foreground">No tiers yet. Create your first tier (e.g. Bronze, Silver, Gold).</p>
            </div>
          )}
          {tiers.map(tier => (
            <div key={tier.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: tier.color + "22" }}>
                  {tier.badge_emoji}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-body font-semibold">{tier.name}</p>
                    {tier.discount_percent > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{tier.discount_percent}% off</span>}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">Min {tier.min_visits || 0} visits · Min ${tier.min_spending || 0} spent</p>
                  {tier.perks && <p className="font-body text-sm text-muted-foreground mt-1">{tier.perks}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-body text-xs text-muted-foreground">{members.filter(m => m.tier_id === tier.id).length} members</span>
                <button onClick={() => { setEditingTier(tier); setShowTierForm(true); }} className="p-1.5 hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteTier(tier.id)} className="p-1.5 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}