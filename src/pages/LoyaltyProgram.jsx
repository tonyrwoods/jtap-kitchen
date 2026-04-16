import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion } from "framer-motion";
import { Crown, Star } from "lucide-react";

export default function LoyaltyProgram() {
  useSeoMeta("loyalty");
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.LoyaltyTier.filter({ is_active: true }, "min_visits", 10)
      .then(data => { setTiers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Exclusive Rewards</p>
          <h1 className="font-heading text-5xl font-semibold mb-4">Loyalty Program</h1>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            The more you dine with us, the more you're rewarded. Our loyalty tiers unlock exclusive perks, discounts, and unforgettable experiences.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : tiers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Crown className="w-10 h-10 mx-auto mb-3" />
            <p className="font-body">Our loyalty program is coming soon. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border-2 border-border rounded-2xl p-8 text-center flex flex-col"
                style={{ borderColor: tier.color + "55" }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
                  style={{ backgroundColor: tier.color + "22" }}>
                  {tier.badge_emoji}
                </div>
                <h3 className="font-heading text-2xl font-semibold mb-2" style={{ color: tier.color }}>{tier.name}</h3>
                {tier.discount_percent > 0 && (
                  <div className="inline-block mx-auto mb-4 px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: tier.color }}>
                    {tier.discount_percent}% Discount
                  </div>
                )}
                <div className="text-left mt-2 mb-6 space-y-2 flex-1">
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Qualifications</p>
                  {tier.min_visits > 0 && <p className="font-body text-sm text-muted-foreground">🍽 {tier.min_visits}+ visits</p>}
                  {tier.min_spending > 0 && <p className="font-body text-sm text-muted-foreground">💰 ${tier.min_spending}+ total spent</p>}
                  {tier.perks && (
                    <>
                      <p className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold mt-4 mb-2">Perks</p>
                      <p className="font-body text-sm text-foreground">{tier.perks}</p>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-14">
          <p className="font-body text-muted-foreground mb-4">Ready to start earning? Make a reservation today.</p>
          <a href="/#reserve" className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity">
            Reserve a Table
          </a>
        </div>
      </div>
    </div>
  );
}