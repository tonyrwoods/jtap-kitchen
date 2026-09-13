import { Check } from "lucide-react";
import { Users } from "lucide-react";

const OPTIONS = [
  { value: "Social Gathering", price: "Starting at $1,600", guests: "Up to 30 guests", blurb: "3-hour exclusive dining, welcome cocktail, custom appetizer spread." },
  { value: "Elevated Experience", price: "Starting at $3,600", guests: "30–60 guests", blurb: "4-hour private space, champagne toast, 3-course plated dinner.", featured: true },
  { value: "Full Buyout", price: "Starting at $9,000", guests: "60–150 guests", blurb: "Full restaurant buyout, custom prix-fixe, open bar packages." },
  { value: "Not Sure", price: "Let's discuss", guests: "Any size", blurb: "Not sure yet — our events team will help you choose the right fit." },
];

export default function WizardStepPackage({ form, set }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Choose your package</h3>
        <p className="font-body text-sm text-muted-foreground">Pick the experience that fits your vision — pricing is a starting point; we'll finalize a custom quote.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPTIONS.map((opt) => {
          const selected = form.package === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => set("package", opt.value)}
              className={`relative text-left border-2 rounded-2xl p-5 transition-all ${
                selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
              }`}
            >
              {opt.featured && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">Popular</span>
              )}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-heading text-lg font-bold">{opt.value}</h4>
                {selected && <Check className="w-5 h-5 text-primary shrink-0" />}
              </div>
              <p className="font-heading text-base font-semibold text-primary mb-1">{opt.price}</p>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground">{opt.guests}</span>
              </div>
              <p className="font-body text-sm text-muted-foreground">{opt.blurb}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}