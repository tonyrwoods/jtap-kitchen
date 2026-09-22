import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Crown, User } from "lucide-react";

const GOLD = "#C89B4F";

function setMetaProperty(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setMetaName(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
  el.setAttribute("href", url);
}

export default function FoundingMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TapRoomMember.filter({ is_founding_member: true })
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.member_number || 999) - (b.member_number || 999));
        setMembers(sorted);

        // Open Graph + Twitter meta — first wall photo powers the rich preview
        const shareUrl = `${window.location.origin}/founding-members`;
        const ogImage = sorted.find((m) => m.wall_photo_url)?.wall_photo_url || null;
        document.title = "The Founding Members — JTAP Kitchen";
        const desc = "Meet the founding members of the JTAP Room Society — the first to join, forever part of the family.";
        setMetaProperty("og:type", "website");
        setMetaProperty("og:site_name", "JTAP Kitchen");
        setMetaProperty("og:title", "The Founding Members of the JTAP Room Society");
        setMetaProperty("og:description", desc);
        if (ogImage) setMetaProperty("og:image", ogImage);
        setMetaProperty("og:url", shareUrl);
        setMetaName("twitter:card", ogImage ? "summary_large_image" : "summary");
        setMetaName("twitter:title", "The Founding Members of the JTAP Room Society");
        setMetaName("twitter:description", desc);
        if (ogImage) setMetaName("twitter:image", ogImage);
        setCanonical(shareUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>
      {/* HERO */}
      <section className="py-24 px-6 text-center" style={{ background: "linear-gradient(to bottom, #000 0%, #0a0a0a 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Crown className="w-14 h-14 mx-auto mb-8" style={{ color: GOLD }} />
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 tracking-tight" style={{ color: GOLD }}>
            THE FOUNDING MEMBERS
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            The first to believe in the JTAP Room Society. Their names are etched on our wall — and here, forever.
          </p>
        </motion.div>
      </section>

      {/* MASONRY GRID */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-56 mb-5 break-inside-avoid animate-pulse" style={{ background: "#1a1a1a" }} />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-20">
              <Crown className="w-16 h-16 mx-auto mb-6 opacity-20" style={{ color: GOLD }} />
              <h2 className="font-heading text-3xl font-bold mb-4">Founding spots are still available.</h2>
              <p className="font-body text-lg mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                Be part of history. Your name lives here forever.
              </p>
              <Link to="/tap-room-society#join"
                className="inline-block px-10 py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase"
                style={{ background: GOLD, color: "#0a0a0a" }}>
                Become a Founding Member
              </Link>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5">
              {members.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05 }}
                  className="rounded-2xl overflow-hidden mb-5 break-inside-avoid"
                  style={{ background: "#151515", border: `1px solid ${GOLD}30` }}>
                  {m.wall_photo_url ? (
                    <img src={m.wall_photo_url} alt={m.guest_name} loading="lazy" className="w-full object-cover" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center" style={{ background: `${GOLD}10` }}>
                      <User className="w-12 h-12" style={{ color: `${GOLD}80` }} />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-heading text-lg font-bold text-white mb-2">{m.guest_name}</p>
                    {m.founding_member_quote && (
                      <p className="font-body text-sm italic leading-relaxed" style={{ color: GOLD, opacity: 0.85 }}>
                        &ldquo;{m.founding_member_quote}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
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
          Become a TapRoom Society Member
        </Link>
      </section>
    </div>
  );
}