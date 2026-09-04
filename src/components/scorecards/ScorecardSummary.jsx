import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import StarRating from "./StarRating";

function avg(nums) {
  const xs = nums.filter((n) => Number(n) > 0);
  return xs.length ? xs.reduce((s, n) => s + Number(n), 0) / xs.length : 0;
}

const CATEGORIES = [
  { key: "dishes_rating", label: "Dishes" },
  { key: "presentation_rating", label: "Presentation" },
  { key: "service_rating", label: "Service" },
  { key: "atmosphere_rating", label: "Atmosphere" },
  { key: "value_rating", label: "Value" },
  { key: "hospitality_rating", label: "Hospitality" },
];

function CategoryBreakdown({ cards }) {
  const active = CATEGORIES.filter((c) => cards.some((x) => Number(x[c.key]) > 0));
  if (!active.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {active.map((c) => (
        <div key={c.key} className="bg-background border border-border rounded-xl p-4 text-center">
          <p className="font-body text-xs text-muted-foreground mb-1">{c.label}</p>
          <p className="font-heading text-2xl font-bold text-foreground mb-1">
            {avg(cards.map((x) => x[c.key])).toFixed(1)}
          </p>
          <StarRating value={Math.round(avg(cards.map((x) => x[c.key])))} size="w-3.5 h-3.5" className="justify-center" />
        </div>
      ))}
    </div>
  );
}

// Read-only display of approved scorecards for a promotion. Returns null while
// loading or if none are approved yet, so callers can drop it in anywhere.
export default function ScorecardSummary({ slug, limit = 100 }) {
  const [cards, setCards] = useState(null);

  useEffect(() => {
    if (!slug) return;
    base44.entities.PromotionScorecard
      .filter({ share_slug: slug, status: "Approved" }, "-created_date", limit)
      .then(setCards)
      .catch(() => setCards([]));
  }, [slug, limit]);

  if (!cards || cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h3 className="font-heading text-lg font-semibold mb-1">Guest Scorecards</h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          {cards.length} guest{cards.length !== 1 ? "s" : ""} have rated this experience
        </p>
        <CategoryBreakdown cards={cards} />
      </div>

      <div className="space-y-4">
        {cards.map((c, i) => {
          const ratings = [
            Number(c.dishes_rating),
            Number(c.presentation_rating),
            Number(c.service_rating),
            Number(c.atmosphere_rating),
            Number(c.value_rating),
            Number(c.hospitality_rating),
          ];
          const overall = avg(ratings);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2) }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{c.guest_name}</p>
                  {c.visit_date && (
                    <p className="font-body text-xs text-muted-foreground">
                      Visited {new Date(c.visit_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="font-heading text-sm font-bold text-primary">{overall.toFixed(1)}</span>
                    <StarRating value={Math.round(overall)} size="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              {c.favorite_dish && (
                <p className="font-body text-xs text-primary font-medium mb-2">★ Favorite dish: {c.favorite_dish}</p>
              )}
              {c.comment && (
                <p className="font-body text-sm leading-relaxed text-foreground/90">"{c.comment}"</p>
              )}
              {c.manager_response && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="font-body text-xs font-semibold text-primary mb-1">Response from JTAP Kitchen</p>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{c.manager_response}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}