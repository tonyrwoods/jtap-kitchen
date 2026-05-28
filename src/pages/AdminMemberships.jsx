import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Users, Crown, Search, Plus, X, Check, ChevronDown } from "lucide-react";

const GOLD = "#C89B4F";
const TIER_COLORS = {
  "Regular": "#9ca3af", "Tap Member": "#cd7f32", "Reserve Member": "#94a3b8", "Founding Member": GOLD
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.15)" }}>
      <p className="font-body text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
      <p className="font-heading text-2xl font-bold" style={{ color: GOLD }}>{value}</p>
      {sub && <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>}
    </div>
  );
}

export default function AdminMemberships() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adjustModal, setAdjustModal] = useState(null); // member
  const [addModal, setAddModal] = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [adjForm, setAdjForm] = useState({ points: "", description: "", type: "Bonus" });
  const [newMember, setNewMember] = useState({ guest_name: "", email: "", phone: "", tier: "Regular" });

  const { data: authUser } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["all-members"],
    queryFn: () => base44.entities.TapRoomMember.list("-created_date", 500),
    enabled: authUser?.role === "admin",
  });

  const updateMember = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TapRoomMember.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-members"] }),
  });

  const createActivity = useMutation({
    mutationFn: (data) => base44.entities.PointsActivity.create(data),
  });

  const createMember = useMutation({
    mutationFn: (data) => base44.entities.TapRoomMember.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-members"] }); setAddModal(false); toast.success("Member added!"); },
  });

  const handleAdjustPoints = async () => {
    const pts = parseInt(adjForm.points);
    if (!pts || !adjForm.description) { toast.error("Enter points and description."); return; }
    const newBalance = (adjustModal.points_balance || 0) + pts;
    await createActivity.mutateAsync({
      member_id: adjustModal.id,
      member_name: adjustModal.guest_name,
      member_email: adjustModal.email,
      transaction_type: adjForm.type,
      points: pts,
      balance_after: newBalance,
      trigger: "admin_adjustment",
      description: adjForm.description,
      transaction_date: new Date().toISOString().split("T")[0],
    });
    await updateMember.mutateAsync({ id: adjustModal.id, data: { points_balance: newBalance } });
    qc.invalidateQueries({ queryKey: ["all-members"] });
    setAdjustModal(null);
    setAdjForm({ points: "", description: "", type: "Bonus" });
    toast.success("Points adjusted!");
  };

  const handleAddFounder = async (m) => {
    const num = (members.filter(x => x.is_founding_member).length || 0) + 1;
    await base44.entities.FoundingMemberWall.create({
      member_id: m.id,
      member_number: num,
      display_name: m.guest_name,
      is_displayed: true,
      sort_order: num,
      member_since: m.joined_date,
    });
    toast.success("Added to Founders Wall!");
  };

  const filtered = members.filter(m => {
    const s = search.toLowerCase();
    const matchSearch = !s || m.guest_name?.toLowerCase().includes(s) || m.email?.toLowerCase().includes(s);
    const matchTier = !tierFilter || m.tier === tierFilter;
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  const totalRevenue = members.filter(m => m.annual_fee_paid).reduce((s, m) => s + (m.annual_fee_amount || 0), 0);
  const totalPoints = members.reduce((s, m) => s + (m.points_balance || 0), 0);
  const byTier = (t) => members.filter(m => m.tier === t).length;

  if (authUser?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
      <p className="font-heading text-2xl text-white">Admin access required</p>
    </div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#fff" }}>
      <div className="px-6 py-10" style={{ background: "#111", borderBottom: `1px solid ${GOLD}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: GOLD }}>Admin</p>
            <h1 className="font-heading text-3xl font-bold">Membership Management</h1>
          </div>
          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-body font-bold text-sm"
            style={{ background: GOLD, color: "#0a0a0a" }}>
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Total Members" value={members.length} />
          <StatCard label="Founding" value={byTier("Founding Member")} />
          <StatCard label="Reserve" value={byTier("Reserve Member")} />
          <StatCard label="Tap Members" value={byTier("Tap Member")} />
          <StatCard label="Regular" value={byTier("Regular")} />
          <StatCard label="Fee Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="paid members" />
          <StatCard label="Points Outstanding" value={totalPoints.toLocaleString()} />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
              className="pl-9 pr-4 py-2.5 rounded-xl font-body text-sm focus:outline-none w-64"
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
          </div>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <option value="">All Tiers</option>
            {["Regular","Tap Member","Reserve Member","Founding Member"].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-body text-sm focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <option value="">All Status</option>
            {["Active","Inactive","Suspended","Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
          {(search || tierFilter || statusFilter) && (
            <button onClick={() => { setSearch(""); setTierFilter(""); setStatusFilter(""); }}
              className="font-body text-sm" style={{ color: GOLD }}>Clear filters</button>
          )}
        </div>

        {/* TABLE */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ background: "#141414" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["#","Name","Email","Tier","Points","Spend","Visits","Access","Kit","Card","Status","Joined","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={13} className="px-4 py-8 text-center font-body text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
                ) : filtered.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-body text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {m.member_number ? `#${String(m.member_number).padStart(3,"0")}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-white whitespace-nowrap">{m.guest_name}</td>
                    <td className="px-4 py-3 font-body text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{m.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full font-body text-xs font-bold"
                        style={{ background: `${TIER_COLORS[m.tier] || "#666"}20`, color: TIER_COLORS[m.tier] || "#666" }}>
                        {m.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm" style={{ color: GOLD }}>{(m.points_balance || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-body text-sm text-white">${(m.total_spend || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-body text-sm text-white">{m.total_visits || 0}</td>
                    <td className="px-4 py-3 text-center">{m.private_room_access ? <Check className="w-4 h-4 mx-auto" style={{ color: GOLD }} /> : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => updateMember.mutate({ id: m.id, data: { welcome_kit_sent: !m.welcome_kit_sent } })}
                        className="text-xs px-2 py-1 rounded transition-all"
                        style={{ background: m.welcome_kit_sent ? "#22c55e20" : "rgba(255,255,255,0.05)", color: m.welcome_kit_sent ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
                        {m.welcome_kit_sent ? "✓" : "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => updateMember.mutate({ id: m.id, data: { physical_card_sent: !m.physical_card_sent } })}
                        className="text-xs px-2 py-1 rounded transition-all"
                        style={{ background: m.physical_card_sent ? "#22c55e20" : "rgba(255,255,255,0.05)", color: m.physical_card_sent ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
                        {m.physical_card_sent ? "✓" : "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-xs" style={{ color: m.status === "Active" ? "#22c55e" : "rgba(255,255,255,0.4)" }}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.joined_date || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAdjustModal(m)}
                          className="px-2.5 py-1 rounded-lg font-body text-xs font-bold transition-all"
                          style={{ background: `${GOLD}15`, color: GOLD }}>Points</button>
                        {m.tier === "Founding Member" && (
                          <button onClick={() => handleAddFounder(m)}
                            className="px-2.5 py-1 rounded-lg font-body text-xs font-bold transition-all"
                            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>Wall</button>
                        )}
                        <button onClick={() => setDetailMember(m)}
                          className="px-2.5 py-1 rounded-lg font-body text-xs font-bold transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3" style={{ background: "#111", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Showing {filtered.length} of {members.length} members</p>
          </div>
        </div>
      </div>

      {/* ADJUST POINTS MODAL */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-md rounded-2xl p-8 space-y-5" style={{ background: "#1a1a1a", border: `1px solid ${GOLD}30` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-white">Adjust Points — {adjustModal.guest_name}</h3>
              <button onClick={() => setAdjustModal(null)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <p className="font-body text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Current balance: <span style={{ color: GOLD }}>{(adjustModal.points_balance || 0).toLocaleString()} pts</span>
            </p>
            <select value={adjForm.type} onChange={e => setAdjForm(f => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "#252525", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              {["Earn","Bonus","Adjustment","Redeem","Expire"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="number" value={adjForm.points} onChange={e => setAdjForm(f => ({ ...f, points: e.target.value }))}
              placeholder="Points (use negative to subtract)" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "#252525", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            <input value={adjForm.description} onChange={e => setAdjForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description / reason" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "#252525", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            <button onClick={handleAdjustPoints}
              className="w-full py-3 rounded-full font-body font-bold text-sm" style={{ background: GOLD, color: "#0a0a0a" }}>
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-md rounded-2xl p-8 space-y-5" style={{ background: "#1a1a1a", border: `1px solid ${GOLD}30` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-white">Add Member</h3>
              <button onClick={() => setAddModal(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            {[
              { key: "guest_name", label: "Full Name *", type: "text" },
              { key: "email", label: "Email *", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="font-body text-sm mb-1 block" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</label>
                <input type={type} value={newMember[key] || ""} onChange={e => setNewMember(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: "#252525", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              </div>
            ))}
            <div>
              <label className="font-body text-sm mb-1 block" style={{ color: "rgba(255,255,255,0.6)" }}>Tier</label>
              <select value={newMember.tier} onChange={e => setNewMember(f => ({ ...f, tier: e.target.value }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: "#252525", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                {["Regular","Tap Member","Reserve Member","Founding Member"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={() => createMember.mutate({
              ...newMember,
              joined_date: new Date().toISOString().split("T")[0],
              status: "Active",
              points_balance: 0,
              private_room_access: ["Reserve Member","Founding Member"].includes(newMember.tier),
            })}
              className="w-full py-3 rounded-full font-body font-bold text-sm" style={{ background: GOLD, color: "#0a0a0a" }}>
              Create Member
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-lg rounded-2xl p-8 max-h-[80vh] overflow-y-auto" style={{ background: "#1a1a1a", border: `1px solid ${GOLD}30` }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-white">{detailMember.guest_name}</h3>
              <button onClick={() => setDetailMember(null)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Email", detailMember.email], ["Phone", detailMember.phone], ["Tier", detailMember.tier],
                ["Points Balance", (detailMember.points_balance || 0).toLocaleString()],
                ["Total Spend", `$${(detailMember.total_spend || 0).toLocaleString()}`],
                ["Total Visits", detailMember.total_visits || 0],
                ["Joined", detailMember.joined_date], ["Status", detailMember.status],
                ["Private Access", detailMember.private_room_access ? "Yes" : "No"],
                ["Free Rentals", detailMember.free_rentals_remaining || 0],
                ["Welcome Credit", `$${detailMember.welcome_credit_remaining || 0}`],
                ["Referral Code", detailMember.referral_code || "—"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                  <p className="font-body text-sm text-white">{val}</p>
                </div>
              ))}
            </div>
            {detailMember.notes && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="font-body text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Admin Notes</p>
                <p className="font-body text-sm text-white">{detailMember.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}