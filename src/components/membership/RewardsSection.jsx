import { useState } from "react";
import { Sparkles, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const GOLD = "#C89B4F";

const REWARDS = [
  { points: 500,  label: "Free Appetizer",         desc: "Any appetizer on us at your next visit." },
  { points: 1000, label: "$10 Dining Credit",       desc: "Applied to your bill — no minimum required." },
  { points: 1500, label: "Free Dessert for Two",    desc: "Choose any dessert for you and a guest." },
  { points: 2500, label: "$25 Dining Credit",       desc: "Applied to your bill at any visit." },
  { points: 5000, label: "Complimentary Dinner",    desc: "A full dinner for two, on us. Up to $80 value." },
  { points: 7500, label: "Private Room Happy Hour", desc: "2-hour private room access for you and up to 8 guests." },
];

export default function RewardsSection({ points }) {
  const queryClient = useQueryClient();
  const [redeeming, setRedeeming] = useState(null);
  const [confirmPoints, setConfirmPoints] = useState(null);

  const unlocked = REWARDS.filter(r => r.points <= points);
  const locked   = REWARDS.filter(r => r.points > points);
  const next     = locked[0];
  const pctToNext = next ? Math.min((points / next.points) * 100, 100) : 100;

  const handleRedeem = async (r) => {
    if (confirmPoints === r.points) {
      setRedeeming(r.points);
      setConfirmPoints(null);
      try {
        const res = await base44.functions.invoke("redeemLoyaltyPoints", { rewardPoints: r.points });
        if (res.data?.success) {
          toast.success(`${r.label} redeemed! Check your email — show it to your server.`);
          queryClient.invalidateQueries({ queryKey: ["my-membership"] });
          queryClient.invalidateQueries({ queryKey: ["my-points"] });
        } else {
          toast.error(res.data?.error || "Redemption failed");
        }
      } catch {
        toast.error("Redemption failed");
      }
      setRedeeming(null);
    } else {
      setConfirmPoints(r.points);
      setTimeout(() => setConfirmPoints(p => (p === r.points ? null : p)), 4000);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(200,155,79,0.15)" }}>
      {/* Header */}
      <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
          <p className="font-body text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>Rewards</p>
        </div>
        <span className="font-body text-sm font-bold" style={{ color: GOLD }}>{points.toLocaleString()} pts</span>
      </div>

      <div className="px-7 py-6 space-y-6">
        {/* Progress to next reward */}
        {next && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Next reward: <span className="font-semibold text-white">{next.label}</span></p>
              <p className="font-body text-xs" style={{ color: GOLD }}>{next.points.toLocaleString()} pts needed</p>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#333" }}>
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pctToNext}%`, background: `linear-gradient(to right, ${GOLD}, #e8b86d)` }} />
            </div>
            <p className="font-body text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {Math.max(0, next.points - points).toLocaleString()} more points to unlock
            </p>
          </div>
        )}

        {/* Reward cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REWARDS.map((r) => {
            const isUnlocked = r.points <= points;
            const isRedeeming = redeeming === r.points;
            const isConfirming = confirmPoints === r.points;
            return (
              <div key={r.points} className="rounded-xl p-4 flex flex-col transition-all"
                style={{
                  background: isUnlocked ? `${GOLD}10` : "#252525",
                  border: `1px solid ${isUnlocked ? `${GOLD}40` : "rgba(255,255,255,0.06)"}`,
                  opacity: isUnlocked ? 1 : 0.6,
                }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isUnlocked
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
                      : <Lock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-bold text-white leading-tight">{r.label}</p>
                    <p className="font-body text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{r.desc}</p>
                    <p className="font-body text-xs mt-1.5 font-bold" style={{ color: isUnlocked ? GOLD : "rgba(255,255,255,0.3)" }}>
                      {r.points.toLocaleString()} pts
                    </p>
                  </div>
                </div>
                {isUnlocked && (
                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={isRedeeming}
                    className="mt-3 w-full py-2 rounded-lg font-body text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                    style={
                      isConfirming
                        ? { background: GOLD, color: "#0a0a0a" }
                        : { background: "rgba(255,255,255,0.05)", color: GOLD, border: `1px solid ${GOLD}40` }
                    }>
                    {isRedeeming
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redeeming…</>
                      : isConfirming
                        ? "Tap to confirm"
                        : "Redeem"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {unlocked.length > 0 && (
          <p className="font-body text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            🎉 You have {unlocked.length} reward{unlocked.length > 1 ? "s" : ""} available. Tap Redeem to claim — a confirmation email will be sent to show your server.
          </p>
        )}
      </div>
    </div>
  );
}