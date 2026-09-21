import { motion } from "framer-motion";
import { Wine, Martini, GlassWater } from "lucide-react";

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

export default function LiquorMenuContent({ items, activeSection }) {
  const cocktails = items
    .filter((i) => i.section === "Signature Cocktails")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const wines = items
    .filter((i) => i.section === "Wine List")
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const spirits = items.filter((i) => i.section === "Spirits & Liquors");

  const showCocktails = !activeSection || activeSection === "Signature Cocktails";
  const showWines = !activeSection || activeSection === "Wine List";
  const showSpirits = !activeSection || activeSection === "Spirits & Liquors";

  return (
    <div className="space-y-12">
      {showCocktails && cocktails.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Martini className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold">Signature Cocktails</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cocktails.map((item, i) => (
              <CocktailCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </section>
      )}

      {showWines && wines.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Wine className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold">Wine List</h2>
          </div>
          <WineTable items={wines} />
          <p className="font-body text-xs text-muted-foreground mt-2">
            Pricing for some selections may be unavailable — please ask your server.
          </p>
        </section>
      )}

      {showSpirits && spirits.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <GlassWater className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold">Spirits &amp; Liquors</h2>
          </div>
          <SpiritsGrid items={spirits} />
        </section>
      )}
    </div>
  );
}