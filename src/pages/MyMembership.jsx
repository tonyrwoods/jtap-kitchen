import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Crown, Star, Lock, Gift, Copy, Check, ChevronDown, ChevronUp, TrendingUp, Wallet, CalendarDays } from "lucide-react";

const GOLD = "#C89B4F";

const TIER_CONFIG = {
  "Regular":        { color: "#9ca3af", discount: 0,  nextTier: "Tap Member",     nextAt: 500   },
  "Tap Member":     { color: "#cd7f32", discount: 10, nextTier: "Reserve Member",  nextAt: 2500  },
  "Reserve Member": { color: "#94a3b8", discount: 15, nextTier: "Founding Member", nextAt: 10000 },
  "Founding Member":{ color: GOLD,      discount: 20, nextTier: null,              nextAt: null  },
};

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.15)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: GOLD }} />
        <span className="font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <p className="font-heading text-3xl font-bold" style={{ color: GOLD }}>{value}</p>
      {sub && <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
    </div>
  );
}

function EarnRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
      <span className="font-body text-sm font-bold" style={{ color: GOLD }}>{value}</span>
    </div>
  );
}

export default function MyMembership() {
  const [copied, setCopied] = useState(false);
  const [earnOpen, setEarnOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const { data: authUser } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });

  const { data: members = [] } = useQuery({
    queryKey: ["my-membership", authUser?.email],
    queryFn: () => base44.entities.TapRoomMember.filter({ email: authUser.email }),
    enabled: !!authUser?.email,
  });
  const member = members[0] || null;

  const { data: allActivity = [] } = useQuery({
    queryKey: ["my-points", member?.id],
    queryFn: () => base44.entities.PointsActivity.filter({ member_email: authUser.email }),
    enabled: !!member?.id,
  });
  const activity = [...allActivity].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  const paged = activity.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const copyCode = () => {
    if (!member?.referral_code) return;
    navigator.clipboard.writeText(member.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tier = member?.tier || "Regular";
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG["Regular"];
  const currentMonth = new Date().getMonth() + 1;
  const isBirthmonth = member?.birthday_month === currentMonth;
  const spendProgress = tier !== "Founding Member" && tierCfg.nextAt > 0
    ? Math.min(((member?.current_year_spend || 0) / tierCfg.nextAt) * 100, 100) : 100;

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD }} />
          <p className="font-heading text-2xl text-white mb-4">Sign in to view your membership</p>
          <button onClick={() => base44.auth.redirectToLogin("/my-membership")}
            className="px-8 py-3 rounded-full font-body font-bold text-sm" style={{ background: GOLD, color: "#0a0a0a" }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
        <div className="text-center max-w-md px-6">
          <Crown className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD }} />
          <p className="font-heading text-2xl text-white mb-3">You&apos;re not a member yet</p>
          <p className="font-body text-white/50 mb-6">Join The Tap Room Society to access your member dashboard.</p>
          <Link to="/tap-room-society#join"
            className="inline-block px-8 py-3 rounded-full font-body font-bold text-sm" style={{ background: GOLD, color: "#0a0a0a" }}>
            Join The Society
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#fff" }}>

      {/* TOP BANNER */}
      <div className="px-6 py-10" style={{ background: "linear-gradient(135deg, #1a1208 0%, #2d1f08 100%)", borderBottom: `1px solid ${GOLD}30` }}>
        <div className="max-w-5xl mx-auto">
          {isBirthmonth && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-5 py-3 mb-6 flex items-center gap-3"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>
              <Gift className="w-5 h-5" style={{ color: GOLD }} />
              <span className="font-body text-sm font-bold" style={{ color: GOLD }}>🎂 $30 birthday reward active this month! Mention it at your next visit.</span>
            </motion.div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-body text-xs uppercase tracking-widest mb-2" style={{ color: GOLD }}>The Tap Room Society</p>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">{member.guest_name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-full font-body text-xs font-bold uppercase tracking-wider"
                  style={{ background: `${tierCfg.color}20`, color: tierCfg.color, border: `1px solid ${tierCfg.color}40` }}>
                  {tier}
                </span>
                {member.member_number && (
                  <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>#{String(member.member_number).padStart(3, "0")}</span>
                )}
                <span className="px-2 py-0.5 rounded-full font-body text-xs" style={{ background: "#22c55e20", color: "#22c55e" }}>
                  {member.status}
                </span>
              </div>
            </div>
            <Link to="/book-private-room"
              className="inline-block px-6 py-3 rounded-full font-body font-bold text-sm self-start sm:self-center"
              style={{ background: GOLD, color: "#0a0a0a" }}>
              Book Private Room
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Points Balance" value={(member.points_balance || 0).toLocaleString()} icon={Star} />
          <StatCard label="Total Visits" value={member.total_visits || 0} icon={CalendarDays} />
          <StatCard label="Lifetime Spend" value={`$${(member.total_spend || 0).toLocaleString()}`} icon={Wallet} />
          <StatCard label="Your Discount" value={`${tierCfg.discount}%`} sub="off every meal" icon={TrendingUp} />
        </div>

        {/* TIER PROGRESS */}
        <div className="rounded-2xl p-7" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
          <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Tier Progress</p>
          {tier === "Founding Member" ? (
            <p className="font-heading text-xl text-white">👑 You&apos;ve reached the highest tier. Welcome to the Founding 20.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm" style={{ color: tierCfg.color }}>{tier}</span>
                <span className="font-body text-sm" style={{ color: TIER_CONFIG[tierCfg.nextTier]?.color }}>{tierCfg.nextTier}</span>
              </div>
              <div className="w-full h-2.5 rounded-full" style={{ background: "#333" }}>
                <div className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${spendProgress}%`, background: `linear-gradient(to right, ${GOLD}, #e8b86d)` }} />
              </div>
              <p className="font-body text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                You&apos;ve spent <span style={{ color: GOLD }}>${(member.current_year_spend || 0).toLocaleString()}</span> this year.
                Spend <span style={{ color: GOLD }}>${Math.max(0, tierCfg.nextAt - (member.current_year_spend || 0)).toLocaleString()}</span> more to reach {tierCfg.nextTier}.
              </p>
            </>
          )}
        </div>

        {/* WELCOME CREDIT */}
        {(member.welcome_credit_remaining || 0) > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}40` }}>
            <Wallet className="w-7 h-7 shrink-0" style={{ color: GOLD }} />
            <div>
              <p className="font-body text-sm font-bold" style={{ color: GOLD }}>
                You have ${member.welcome_credit_remaining} in welcome credit
              </p>
              <p className="font-body text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Mention this at your next visit to apply it to your bill.</p>
            </div>
          </motion.div>
        )}

        {/* PRIVATE ROOM */}
        <div className="rounded-2xl p-7"
          style={{ background: member.private_room_access ? "#1a1a1a" : "#111", border: member.private_room_access ? `1px solid ${GOLD}30` : "1px solid rgba(255,255,255,0.07)" }}>
          <p className="font-body text-xs uppercase tracking-widest mb-4"
            style={{ color: member.private_room_access ? GOLD : "rgba(255,255,255,0.3)" }}>
            Private Room Access
          </p>
          {member.private_room_access ? (
            <>
              <h3 className="font-heading text-2xl font-bold mb-2">THE PRIVATE ROOM</h3>
              <p className="font-body text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                Your exclusive access to our private dining room and bar. Book it for your next special occasion.
              </p>
              {(member.free_rentals_remaining || 0) > 0 && (
                <p className="font-body text-sm mb-5 font-semibold" style={{ color: "#22c55e" }}>
                  🎁 You have {member.free_rentals_remaining} complimentary rental{member.free_rentals_remaining > 1 ? "s" : ""} remaining
                </p>
              )}
              <Link to="/book-private-room"
                className="inline-block px-6 py-2.5 rounded-full font-body font-bold text-sm"
                style={{ background: GOLD, color: "#0a0a0a" }}>
                BOOK IT NOW
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
                <h3 className="font-heading text-xl font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>Private Room Locked</h3>
              </div>
              <p className="font-body text-sm mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Private Room access is a Reserve Member perk. Upgrade to unlock exclusive booking.
              </p>
              <Link to="/tap-room-society#join"
                className="inline-block px-6 py-2.5 rounded-full font-body font-bold text-sm border"
                style={{ borderColor: GOLD, color: GOLD }}>
                Upgrade Membership
              </Link>
            </>
          )}
        </div>

        {/* REFERRAL */}
        <div className="rounded-2xl p-7" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
          <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Your Referral Code</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-heading text-3xl font-bold tracking-widest" style={{ color: GOLD }}>{member.referral_code || "—"}</span>
            <button onClick={copyCode} className="p-2 rounded-lg transition-all"
              style={{ background: copied ? "#22c55e20" : "rgba(255,255,255,0.05)", color: copied ? "#22c55e" : "rgba(255,255,255,0.5)" }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: "#252525" }}>
              <p className="font-body text-xl font-bold text-white">1,000 pts</p>
              <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>per free member referred</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#252525" }}>
              <p className="font-body text-xl font-bold text-white">2,500 pts</p>
              <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>per paid member referred</p>
            </div>
          </div>
        </div>

        {/* HOW TO EARN */}
        <div className="rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
          <button onClick={() => setEarnOpen(o => !o)}
            className="w-full flex items-center justify-between px-7 py-5">
            <span className="font-body text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>How to Earn More Points</span>
            {earnOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>
          {earnOpen && (
            <div className="px-7 pb-6">
              <EarnRow label="Visit on Sunday, Monday, or Tuesday" value="2× points" />
              <EarnRow label="Bring a party of 6 or more" value="+500 pts" />
              <EarnRow label="Order a bottle of wine" value="+200 pts" />
              <EarnRow label="Refer a free member" value="+1,000 pts" />
              <EarnRow label="Refer a paid member" value="+2,500 pts" />
              <EarnRow label="Visit during birthday month" value="3× points" />
              <EarnRow label="Leave a Google review (one-time)" value="+500 pts" />
            </div>
          )}
        </div>

        {/* POINTS HISTORY */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-body text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>Points History</p>
          </div>
          {paged.length === 0 ? (
            <p className="px-7 py-8 font-body text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No points activity yet. Visit us to start earning!</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Date","Description","Points","Balance After"].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((a, i) => (
                      <tr key={a.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-5 py-3 font-body text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{a.transaction_date || "—"}</td>
                        <td className="px-5 py-3 font-body text-sm text-white">{a.description || a.trigger}</td>
                        <td className="px-5 py-3 font-body text-sm font-bold" style={{ color: a.points > 0 ? "#22c55e" : "#ef4444" }}>
                          {a.points > 0 ? "+" : ""}{a.points?.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-body text-sm" style={{ color: GOLD }}>{a.balance_after?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activity.length > PER_PAGE && (
                <div className="flex items-center justify-between px-7 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="font-body text-sm disabled:opacity-30" style={{ color: GOLD }}>← Prev</button>
                  <span className="font-body text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Page {page}</span>
                  <button disabled={page * PER_PAGE >= activity.length} onClick={() => setPage(p => p + 1)}
                    className="font-body text-sm disabled:opacity-30" style={{ color: GOLD }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}