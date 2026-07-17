import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Crown, User } from "lucide-react";

const GOLD = "#C89B4F";

export default function FoundersWall() {
  useEffect(() => {
    document.title = "The Founding 20 — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Meet the Founding 20 — the first members of the JTAP Kitchen family who showed up before anyone else. Permanent members, forever.");
  }, []);
  const { data: founders = [], isLoading } = useQuery({
    queryKey: ["founders-wall"],
    queryFn: () => base44.entities.FoundingMemberWall.filter({ is_displayed: true }),
  });

  const sorted = [...founders].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>

      {/* HERO */}
      <section className="py-28 px-6 text-center" style={{ background: "linear-gradient(to bottom, #000 0%, #0a0a0a 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Crown className="w-14 h-14 mx-auto mb-8" style={{ color: GOLD }} />
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 tracking-tight" style={{ color: GOLD }}>
            THE FOUNDING 20
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            These are the people who showed up before anyone else.
            They are permanent members of the JTap Kitchen family.
          </p>
        </motion.div>
      </section>

      {/* WALL */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-56 animate-pulse" style={{ background: "#1a1a1a" }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <Crown className="w-16 h-16 mx-auto mb-6 opacity-20" style={{ color: GOLD }} />
              <h2 className="font-heading text-3xl font-bold mb-4">The Founding 20 spots are still available.</h2>
              <p className="font-body text-lg mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                Be part of history. Your name lives here forever.
              </p>
              <Link to="/tap-room-society#join"
                className="inline-block px-10 py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase"
                style={{ background: GOLD, color: "#0a0a0a" }}>
                Claim Your Spot
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {sorted.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-7 flex flex-col items-center text-center relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #1e1612 0%, #1a1410 100%)", border: `1px solid ${GOLD}40` }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />
                  {f.portrait_url ? (
                    <img src={f.portrait_url} alt={f.display_name}
                      className="w-16 h-16 rounded-full object-cover mb-4"
                      style={{ border: `2px solid ${GOLD}` }} />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: `${GOLD}15`, border: `2px solid ${GOLD}30` }}>
                      <User className="w-7 h-7" style={{ color: GOLD }} />
                    </div>
                  )}
                  <p className="font-heading text-3xl font-bold mb-2" style={{ color: GOLD }}>
                    #{String(f.member_number).padStart(3, "0")}
                  </p>
                  <p className="font-heading text-lg font-bold text-white mb-2">{f.display_name}</p>
                  {f.quote && (
                    <p className="font-body text-xs italic mb-3 leading-relaxed" style={{ color: GOLD, opacity: 0.8 }}>
                      "{f.quote}"
                    </p>
                  )}
                  <p className="font-body text-xs mt-auto pt-3" style={{ color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.08)", width: "100%" }}>
                    Member since {f.member_since || f.install_date || "2026"}
                  </p>
                </motion.div>
              ))}
              {/* Empty spots */}
              {sorted.length < 20 && Array.from({ length: Math.min(20 - sorted.length, 8) }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-2xl p-7 flex flex-col items-center justify-center text-center"
                  style={{ background: "#111", border: "1px dashed rgba(200,155,79,0.2)" }}>
                  <p className="font-heading text-3xl font-bold mb-2" style={{ color: "rgba(200,155,79,0.2)" }}>
                    #{String(sorted.length + i + 1).padStart(3, "0")}
                  </p>
                  <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Available</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center" style={{ background: "#111", borderTop: "1px solid rgba(200,155,79,0.1)" }}>
        <p className="font-body text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          Want to become part of the next chapter?
        </p>
        <Link to="/tap-room-society"
          className="inline-block px-10 py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90"
          style={{ background: GOLD, color: "#0a0a0a" }}>
          JOIN THE TAP ROOM SOCIETY
        </Link>
      </section>
    </div>
  );
}