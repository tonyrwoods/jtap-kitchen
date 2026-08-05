import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useRobotsNoindex from "@/hooks/useRobotsNoindex";
import { Link } from "react-router-dom";
import { UserPlus, ChevronRight, Crown, Users, TrendingUp, Mail } from "lucide-react";

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

export default function AdminReferrals() {
  useRobotsNoindex();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Referral Dashboard — JTAP Kitchen";
    base44.entities.TapRoomMember.list("-created_date", 500)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  const referrers = members
    .filter((m) => (m.referral_count || 0) > 0)
    .sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0));
  const referrals = members
    .filter((m) => m.referred_by_code)
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  const totalReferrals = members.reduce((sum, m) => sum + (m.referral_count || 0), 0);
  const topReferrer = referrers[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 lg:px-10 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Referral Dashboard</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Track Tap Room Society member referrals</p>
          </div>
          <Link to="/admin" className="font-body text-sm text-primary hover:underline">← Admin</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Members" value={members.length} color="bg-primary" />
              <StatCard icon={UserPlus} label="Active Referrers" value={referrers.length} color="bg-emerald-500" />
              <StatCard icon={TrendingUp} label="Total Referrals" value={totalReferrals} color="bg-purple-500" />
              <StatCard icon={Crown} label="Top Referrer" value={topReferrer ? `${topReferrer.referral_count}` : "—"} color="bg-amber-500" />
            </div>

            {topReferrer && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                <Crown className="w-8 h-8 text-amber-600 shrink-0" />
                <div>
                  <p className="font-heading text-base font-semibold text-amber-900">Top Referrer: {topReferrer.guest_name}</p>
                  <p className="font-body text-xs text-amber-700">{topReferrer.referral_count} members referred · code <code className="bg-amber-100 px-1.5 py-0.5 rounded">{topReferrer.referral_code || "—"}</code></p>
                </div>
              </div>
            )}

            {/* Top Referrers */}
            <section>
              <h2 className="font-heading text-lg font-semibold mb-3">Top Referrers</h2>
              {referrers.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-2xl">
                  <UserPlus className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
                  <p className="font-body text-sm text-muted-foreground">No referrals recorded yet.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5">Member</th>
                          <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Referral Code</th>
                          <th className="font-body text-xs font-semibold text-muted-foreground px-4 py-2.5 text-right">Referred</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrers.map((m) => (
                          <tr key={m.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-2.5">
                              <p className="font-body text-sm font-medium">{m.guest_name}</p>
                              <p className="font-body text-xs text-muted-foreground">{m.email}</p>
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <code className="font-body text-xs bg-muted px-2 py-0.5 rounded">{m.referral_code || "—"}</code>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="inline-flex items-center gap-1 font-body text-sm font-semibold text-primary">
                                <UserPlus className="w-3.5 h-3.5" />{m.referral_count}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Recent Referrals */}
            {referrals.length > 0 && (
              <section>
                <h2 className="font-heading text-lg font-semibold mb-3">Recent Referrals</h2>
                <div className="space-y-2">
                  {referrals.slice(0, 20).map((m) => (
                    <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate">{m.guest_name}</p>
                        <p className="font-body text-xs text-muted-foreground truncate">
                          Referred by {m.referred_by_name || m.referred_by_code}
                          {m.joined_date ? ` · joined ${m.joined_date}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}