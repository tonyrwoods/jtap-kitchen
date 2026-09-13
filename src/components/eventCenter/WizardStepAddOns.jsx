import { Check, Package } from "lucide-react";

const ADDON_CATEGORIES = ["Audio/Visual", "Decor", "Photography", "Other"];
const MENU_CATEGORIES = ["Appetizers", "Salads & Sandwiches", "Entrees", "Sides", "Desserts", "Drinks"];

function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WizardStepAddOns({ form, set, addons, menuItems, addonCounts, preferredDate }) {
  const toggleAddon = (id) =>
    set("selected_addon_ids",
      form.selected_addon_ids.includes(id)
        ? form.selected_addon_ids.filter((x) => x !== id)
        : [...form.selected_addon_ids, id]);

  const toggleMenu = (id) =>
    set("selected_menu_item_ids",
      form.selected_menu_item_ids.includes(id)
        ? form.selected_menu_item_ids.filter((x) => x !== id)
        : [...form.selected_menu_item_ids, id]);

  const dateLabel = formatDate(preferredDate);

  const soldOut = (a) => {
    if (!preferredDate || !a.inventory_limit) return false;
    return (addonCounts?.[a.id] || 0) >= a.inventory_limit;
  };

  const groupedAddons = ADDON_CATEGORIES
    .map((cat) => ({ cat, items: addons.filter((a) => a.category === cat) }))
    .filter((g) => g.items.length > 0);

  const groupedMenu = MENU_CATEGORIES
    .map((cat) => ({ cat, items: menuItems.filter((m) => m.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Add-ons</h3>
        <p className="font-body text-sm text-muted-foreground">Optional extras to elevate your event.</p>
      </div>

      {addons.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-6">No add-ons available right now.</p>
      ) : (
        <div className="space-y-6">
          {groupedAddons.map(({ cat, items }) => (
            <div key={cat}>
              <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-3">{cat}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((a) => {
                  const selected = form.selected_addon_ids.includes(a.id);
                  const out = soldOut(a);
                  return (
                    <button type="button" key={a.id} onClick={() => !out && toggleAddon(a.id)} disabled={out}
                      className={`text-left border-2 rounded-2xl p-4 transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"} ${out ? "opacity-60 cursor-not-allowed" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-body font-semibold text-foreground">{a.name}</p>
                            {a.image_url && <img src={a.image_url} alt={a.name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />}
                          </div>
                          {a.description && <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                          <p className="font-heading text-sm font-semibold text-primary mt-1">
                            ${Number(a.price).toFixed(0)}
                            <span className="font-body text-xs font-normal text-muted-foreground"> · {a.price_unit}</span>
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary" : "border-border"}`}>
                          {selected && <Check className="w-4 h-4 text-primary-foreground" />}
                        </div>
                      </div>
                      {out && <p className="font-body text-xs text-red-600 mt-2">Sold out for {dateLabel}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-select menu */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-xl font-bold">Pre-select your menu</h3>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-4">Optional — let our team know which dishes you're interested in. The final menu is confirmed during planning.</p>

        {menuItems.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground text-center py-4">No menu items available right now.</p>
        ) : (
          <div className="space-y-5">
            {groupedMenu.map(({ cat, items }) => (
              <div key={cat}>
                <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">{cat}</h4>
                <div className="space-y-1">
                  {items.map((m) => {
                    const selected = form.selected_menu_item_ids.includes(m.id);
                    return (
                      <button type="button" key={m.id} onClick={() => toggleMenu(m.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${selected ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary" : "border-border"}`}>
                          {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-foreground">
                            {m.name}
                            {m.is_featured && <span className="ml-2 text-xs text-primary">★ Chef's Pick</span>}
                          </p>
                        </div>
                        <span className="font-heading text-sm font-semibold text-muted-foreground">${Number(m.price).toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}