import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Wine, Martini, GlassWater } from "lucide-react";
import useSeoMeta from "../hooks/useSeoMeta";

const SPIRIT_ORDER = [
  "Bourbon & Whiskey",
  "Scotch",
  "Cognac",
  "Tequila",
  "Vodka",
  "Gin",
];

const fmtPrice = (v) =>
  v === null || v === undefined || v === "" || Number.isNaN(Number(v))
    ? "—"
    : `$${Number(v).toFixed(2)}`;

function CocktailCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-heading text-lg font-semibold leading-tight">{item.name}</h3>
        {item.price != null && (
          <span className="font-heading text-lg font-bold text-primary shrink-0">
            {fmtPrice(item.price)}
          </span>
        )}
      </div>
      {item.description && (
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          {item.description}
        </p>
      )}
      {item.flavors && (
        <p className="font-body text-xs text-primary font-medium mt-2">
          Flavors: {item.flavors}
        </p>
      )}
    </motion.div>
  );
}

function WineTable({ items }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-secondary/60">
            <th className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 py-3">
              Wine Selection
            </th>
            <th className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 py-3 text-right">
              1/2 Pour (5 oz)
            </th>
            <th className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 py-3 text-right">
              Full Pour (8 oz)
            </th>
            <th className="font-body text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 py-3 text-right">
              Bottle
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={`border-t border-border ${i % 2 === 1 ? "bg-secondary/20" : ""}`}
            >
              <td className="font-body text-sm font-medium px-4 py-3">{item.name}</td>
              <td className="font-body text-sm px-4 py-3 text-right tabular-nums">
                {fmtPrice(item.price_half_pour)}
              </td>
              <td className="font-body text-sm px-4 py-3 text-right tabular-nums">
                {fmtPrice(item.price_full_pour)}
              </td>
              <td className="font-body text-sm font-semibold text-primary px-4 py-3 text-right tabular-nums">
                {fmtPrice(item.price_bottle)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpiritsGrid({ items }) {
  const grouped = SPIRIT_ORDER.reduce((acc, type) => {
    acc[type] = items.filter((i) => i.spirit_type === type);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {SPIRIT_ORDER.filter((t) => grouped[t]?.length).map((type) => (
        <div key={type} className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <GlassWater className="w-4 h-4 text-primary" />
            {type}
          </h3>
          <ul className="space-y-1.5">
            {grouped[type].map((item) => (
              <li key={item.id} className="font-body text-sm text-foreground/90">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function LiquorMenu() {
  useSeoMeta("liquor_menu");
  useEffect(() => {
    document.title = "Liquor Menu — JTAP Kitchen";
  }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.LiquorMenuItem.list("sort_order", 200).then((data) => {
      setItems(data.filter((i) => i && i.id && i.name && i.is_active !== false));
      setLoading(false);
    });
  }, []);

  const cocktails = items
    .filter((i) => i.section === "Signature Cocktails")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const wines = items
    .filter((i) => i.section === "Wine List")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const spirits = items.filter((i) => i.section === "Spirits & Liquors");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1600&q=80"
          alt="JTAP Kitchen Liquor Menu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3">
            JTAP Kitchen
          </p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">
            Liquor Menu
          </h1>
          <p className="font-body text-white/70 max-w-lg text-base md:text-lg">
            Handcrafted cocktails, curated wines, and a full selection of premium spirits.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-16">
            {/* Signature Cocktails */}
            {cocktails.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Martini className="w-6 h-6 text-primary" />
                  <h2 className="font-heading text-3xl md:text-4xl font-bold">
                    Signature Cocktails
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cocktails.map((item, i) => (
                    <CocktailCard key={item.id} item={item} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Wine List */}
            {wines.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Wine className="w-6 h-6 text-primary" />
                  <h2 className="font-heading text-3xl md:text-4xl font-bold">Wine List</h2>
                </div>
                <WineTable items={wines} />
                <p className="font-body text-xs text-muted-foreground mt-3">
                  Pricing for some selections may be unavailable — please ask your server.
                </p>
              </section>
            )}

            {/* Spirits & Liquors */}
            {spirits.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <GlassWater className="w-6 h-6 text-primary" />
                  <h2 className="font-heading text-3xl md:text-4xl font-bold">
                    Spirits &amp; Liquors
                  </h2>
                </div>
                <SpiritsGrid items={spirits} />
              </section>
            )}
          </div>
        )}
      </div>

      <div className="text-center py-8 border-t border-border">
        <p className="font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} JTAP Kitchen · Memphis, TN
        </p>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Please drink responsibly. 21+ with valid ID.
        </p>
      </div>
    </div>
  );
}