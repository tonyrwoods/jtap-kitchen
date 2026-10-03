import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Crown, UserPlus, ChevronRight, ExternalLink, Mail } from "lucide-react";

// Compact in-dashboard view of TapRoom referral activity, with a link to the
// full Referral Dashboard at /admin/referrals. Computes top referrers and
// recent referrals from the member list (the full page already exists, so this
// is a discoverability snapshot, not a replacement).

export default function ReferralsSnapshotTab() {
  const [members, setMembers] = useState([]);
  const [lastRun, setLastRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.TapRoomMember.list("-created_date", 500),
      base44.entities.AppSettings.list().then((d) => d[0] || null).catch(() => null),
    ]).then(([m, s]) => {
      setMembers(m);
      setLastRun(s?.referral_bonus_last_run_at || null);
    }).finally(() => setLoading(false));
  }, []);

  const referrers = members
    .filter((m) => (m.referral_count || 0) > 0)
    .sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0))
    .slice(0, 5);
  const recent = members
    .filter((m) => m.referred_by_code)
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    .slice(0, 5);
  const total = members.reduce((s, m) => s + (m.referral_count || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Referral Activity</h3>
          <p className="font-body text-sm text-muted-foreground">{total} total referrals across {members.length} members</p>
          {lastRun && (
            <p className="font-body text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              Auto-reward job last ran {new Date(lastRun).toLocaleString()}
            </p>
          )}
        </div>
        <Link to="/admin/referrals" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5" /> Full Dashboard
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" /> Top Referrers
        </h4>
        {referrers.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground py-6 text-center">No referrals recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {referrers.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="font-heading text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium truncate">{m.guest_name}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <span className="inline-flex items-center gap-1 font-body text-sm font-semibold text-primary">
                  <UserPlus className="w-3.5 h-3.5" /> {m.referral_count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h4 className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">Recent Referrals</h4>
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium truncate">{m.guest_name}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">Referred by {m.referred_by_name || m.referred_by_code}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}