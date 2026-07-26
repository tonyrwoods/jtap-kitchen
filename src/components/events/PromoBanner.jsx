import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Megaphone, ChevronRight } from "lucide-react";

export default function PromoBanner() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.EventPromotion.filter({ is_active: true }, "date", 5)
      .then((data) => {
        const today = new Date().toISOString().split("T")[0];
        setPromos(data.filter((p) => p.date >= today));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || promos.length === 0) return null;
  const promo = promos[0];

  return (
    <div className="mb-10">
      <Link
        to={`/event-announce/${promo.share_slug}`}
        className="block relative overflow-hidden rounded-2xl border border-primary/30 group"
      >
        {promo.banner_image_url ? (
          <img src={promo.banner_image_url} alt={promo.title} className="w-full h-40 md:h-48 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-40 md:h-48 bg-gradient-to-br from-primary/80 to-primary/40" />
        )}
        <div className={`absolute inset-0 ${promo.banner_image_url ? "bg-gradient-to-r from-black/80 via-black/50 to-transparent" : ""}`} />
        <div className="absolute inset-0 z-10 flex items-center justify-between p-6 md:p-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wide mb-2 backdrop-blur-sm">
              <Megaphone className="w-3 h-3" /> Featured Event
            </span>
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mb-1">{promo.title}</h3>
            {promo.subtitle && <p className="font-body text-sm text-white/80">{promo.subtitle}</p>}
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block" />
        </div>
      </Link>
    </div>
  );
}