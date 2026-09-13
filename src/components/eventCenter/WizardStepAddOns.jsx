import { Check } from "lucide-react";

export default function WizardStepAddOns({ form, set, addons }) {
  const toggle = (id) =>
    set(
      "selected_addon_ids",
      form.selected_addon_ids.includes(id)
        ? form.selected_addon_ids.filter((x) => x !== id)
        : [...form.selected_addon_ids, id]
    );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Enhance with add-ons</h3>
        <p className="font-body text-sm text-muted-foreground">Optional extras to elevate your event. Select any that interest you — we'll confirm availability and final pricing.</p>
      </div>
      {addons.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">No add-ons are listed right now. You can skip this step.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addons.map((a) => {
            const selected = form.selected_addon_ids.includes(a.id);
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => toggle(a.id)}
                className={`text-left border-2 rounded-2xl p-4 transition-all ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-body font-semibold text-foreground">{a.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{a.category}</span>
                    </div>
                    {a.description && <p className="font-body text-xs text-muted-foreground mt-1">{a.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-heading text-base font-semibold text-primary">${Number(a.price).toFixed(0)}</span>
                    <span className="font-body text-[11px] text-muted-foreground">{a.price_unit}</span>
                  </div>
                </div>
                {selected && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <Check className="w-3.5 h-3.5" /> Added
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}