import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Users, Mail, Cake, TrendingDown, Star, Send, Pencil, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function GuestProfilesTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [sendingNps, setSendingNps] = useState(null);
  const [stats, setStats] = useState({ total: 0, avgNps: 0, lapsed: 0, birthdays: 0 });

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const query = search
        ? { $or: [
            { email: { $regex: search, $options: "i" } },
            { full_name: { $regex: search, $options: "i" } },
          ]}
        : {};
      const page = await base44.entities.GuestProfile.filter(query, {
        sort: "-last_visit_date",
        limit: 50,
      });
      setProfiles(page.items || []);

      const count = await base44.entities.GuestProfile.count({});
      const ninetyAgo = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
      const lapsedCount = await base44.entities.GuestProfile.count({ last_visit_date: { $lte: ninetyAgo } });
      const now = new Date();
      const md = (m, d) => m * 100 + d;
      const todayMD = md(now.getMonth() + 1, now.getDate());
      const futureMD = md(...((() => { const f = new Date(Date.now() + 7 * 86400000); return [f.getMonth() + 1, f.getDate()]; })()));
      setStats({
        total: count,
        avgNps: 0,
        lapsed: lapsedCount,
        birthdays: 0,
      });
    } catch {
      toast.error("Could not load guest profiles");
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const handleSendNps = async (profile) => {
    setSendingNps(profile.id);
    try {
      const res = await base44.functions.invoke("sendNpsSurvey", {
        email: profile.email,
        guest_name: profile.full_name,
      });
      if (res.data?.status === "success") {
        toast.success(`NPS survey sent to ${profile.email}`);
      } else {
        toast.error(res.data?.error || "Could not send survey");
      }
    } catch {
      toast.error("Could not send survey");
    }
    setSendingNps(null);
  };

  const startEdit = (p) => {
    setEditing(true);
    setEditForm({
      birthday: p.birthday || "",
      anniversary: p.anniversary || "",
      dietary_notes: p.dietary_notes || "",
      favorite_dishes: p.favorite_dishes || "",
      preferences: p.preferences || "",
      notes: p.notes || "",
      marketing_opt_in: p.marketing_opt_in !== false,
    });
  };

  const saveEdit = async () => {
    try {
      await base44.entities.GuestProfile.update(selected.id, editForm);
      const updated = { ...selected, ...editForm };
      setSelected(updated);
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditing(false);
      toast.success("Guest profile updated");
    } catch {
      toast.error("Could not update profile");
    }
  };

  const npsColor = (score) => {
    if (score >= 9) return "text-green-600 bg-green-50";
    if (score >= 7) return "text-yellow-600 bg-yellow-50";
    if (score !== undefined && score !== null) return "text-red-600 bg-red-50";
    return "text-muted-foreground bg-muted";
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total Guests</p><p className="text-xl font-bold">{stats.total}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100"><TrendingDown className="w-5 h-5 text-orange-600" /></div>
          <div><p className="text-xs text-muted-foreground">Lapsed (90+ days)</p><p className="text-xl font-bold">{stats.lapsed}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-100"><Cake className="w-5 h-5 text-pink-600" /></div>
          <div><p className="text-xs text-muted-foreground">Upcoming Birthdays</p><p className="text-xl font-bold">{stats.birthdays}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100"><Star className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Avg NPS</p><p className="text-xl font-bold">{stats.avgNps || "—"}</p></div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-card text-sm"
        />
      </div>

      {/* List + Detail */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : profiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No guest profiles found.</p>
          ) : profiles.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setEditing(false); }}
              className={`w-full text-left bg-card border rounded-xl p-4 transition-all hover:shadow-sm ${
                selected?.id === p.id ? "border-primary ring-1 ring-primary/20" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.full_name || p.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.nps_score !== undefined && p.nps_score !== null && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${npsColor(p.nps_score)}`}>{p.nps_score}</span>
                  )}
                  {p.birthday && <Cake className="w-3.5 h-3.5 text-pink-500" />}
                  <span className="text-xs text-muted-foreground">{p.total_visits || 0} visits</span>
                </div>
              </div>
              {p.last_visit_date && (
                <p className="text-xs text-muted-foreground mt-1">Last visit: {new Date(p.last_visit_date).toLocaleDateString()}</p>
              )}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold">{selected.full_name || selected.email}</h3>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                {selected.phone && <p className="text-sm text-muted-foreground">{selected.phone}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            {!editing ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Total Visits</p><p className="font-medium">{selected.total_visits || 0}</p></div>
                  <div><p className="text-xs text-muted-foreground">Lifetime Spend</p><p className="font-medium">${(selected.total_spend || 0).toFixed(0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">First Visit</p><p className="font-medium">{selected.first_visit_date ? new Date(selected.first_visit_date).toLocaleDateString() : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Last Visit</p><p className="font-medium">{selected.last_visit_date ? new Date(selected.last_visit_date).toLocaleDateString() : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Birthday</p><p className="font-medium">{selected.birthday || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">NPS Score</p><p className="font-medium">{selected.nps_score ?? "—"}</p></div>
                </div>
                {selected.dietary_notes && <div className="text-sm"><p className="text-xs text-muted-foreground mb-0.5">Dietary Notes</p><p>{selected.dietary_notes}</p></div>}
                {selected.favorite_dishes && <div className="text-sm"><p className="text-xs text-muted-foreground mb-0.5">Favorite Dishes</p><p>{selected.favorite_dishes}</p></div>}
                {selected.preferences && <div className="text-sm"><p className="text-xs text-muted-foreground mb-0.5">Preferences</p><p>{selected.preferences}</p></div>}
                {selected.notes && <div className="text-sm"><p className="text-xs text-muted-foreground mb-0.5">Admin Notes</p><p>{selected.notes}</p></div>}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => startEdit(selected)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleSendNps(selected)}
                    disabled={sendingNps === selected.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {sendingNps === selected.id ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send NPS
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Birthday (MM-DD)</label>
                  <input value={editForm.birthday} onChange={e => setEditForm(f => ({ ...f, birthday: e.target.value }))} placeholder="03-15" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Anniversary</label>
                  <input value={editForm.anniversary} onChange={e => setEditForm(f => ({ ...f, anniversary: e.target.value }))} placeholder="YYYY-MM-DD" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Dietary Notes & Allergies</label>
                  <textarea value={editForm.dietary_notes} onChange={e => setEditForm(f => ({ ...f, dietary_notes: e.target.value }))} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Favorite Dishes</label>
                  <input value={editForm.favorite_dishes} onChange={e => setEditForm(f => ({ ...f, favorite_dishes: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Seating & Service Preferences</label>
                  <input value={editForm.preferences} onChange={e => setEditForm(f => ({ ...f, preferences: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Admin Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.marketing_opt_in} onChange={e => setEditForm(f => ({ ...f, marketing_opt_in: e.target.checked }))} className="rounded" />
                  Marketing opt-in
                </label>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancel</button>
                  <button onClick={saveEdit} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">Save</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm h-fit sticky top-4">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Select a guest to view their profile
          </div>
        )}
      </div>
    </div>
  );
}