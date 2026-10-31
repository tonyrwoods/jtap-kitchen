import { Leaf, Flame, Wheat, Nut, UtensilsCrossed, Sparkles } from "lucide-react";

const DIETARY_STYLES = {
  Vegetarian: { icon: Leaf, classes: "bg-green-50 text-green-700 border-green-200" },
  Vegan: { icon: Leaf, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Gluten-Free": { icon: Wheat, classes: "bg-amber-50 text-amber-700 border-amber-200" },
  "Dairy-Free": { icon: Leaf, classes: "bg-sky-50 text-sky-700 border-sky-200" },
  "Contains Nuts": { icon: Nut, classes: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  Spicy: { icon: Flame, classes: "bg-red-50 text-red-700 border-red-200" },
};

function DietaryBadge({ tag }) {
  const style = DIETARY_STYLES[tag];
  const Icon = style?.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-[11px] font-medium ${
        style?.classes || "bg-muted text-muted-foreground border-border"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {tag}
    </span>
  );
}

/**
 * Shared guest-facing menu item card.
 * `footer` lets ordering surfaces (table QR menu) append their cart controls.
 */
export default function MenuItemCard({ item, footer, className = "" }) {
  if (!item) return null;

  const price = Number(item.price);
  const hasPrice =
    item.price !== null && item.price !== undefined && item.price !== "" && Number.isFinite(price);
  const tags = Array.isArray(item.dietary_tags) ? item.dietary_tags : [];

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-secondary via-muted to-secondary">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/70 ring-1 ring-border">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </span>
            {item.category && (
              <span className="font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {item.category}
              </span>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

        {item.is_featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-sm">
            <Sparkles className="h-3 w-3" />
            Chef's Pick
          </span>
        )}

        {hasPrice && (
          <span className="absolute bottom-3 right-3 rounded-full bg-background/95 px-3 py-1 font-heading text-base font-bold text-foreground shadow-sm backdrop-blur">
            ${price.toFixed(2)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
          {item.name}
        </h3>

        {item.description && (
          <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {item.description}
          </p>
        )}

        <div className="mt-auto">
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <DietaryBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
          {footer && <div className="mt-4 border-t border-border pt-3">{footer}</div>}
        </div>
      </div>
    </article>
  );
}