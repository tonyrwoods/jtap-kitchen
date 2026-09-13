import { Clock, Users, Check, Calendar } from "lucide-react";

const TIERS = [
  { value: "Social Gathering", price: "Starting at $1,600", guests: "Up to 30 guests", blurb: "3-hour exclusive dining, welcome cocktail, custom appetizer spread." },
  { value: "Elevated Experience", price: "Starting at $3,600", guests: "30–60 guests", blurb: "4-hour private space, champagne toast, 3-course plated dinner.", featured: true },
  { value: "Full Buyout", price: "Starting at $9,000", guests: "60–150 guests", blurb: "Full restaurant buyout, custom prix-fixe, open bar packages." },
];

const input = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

export default function WizardStepPackageDate({ form, set, dateBooked, onJoinWaitlist, weekdayInvalid }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Choose your package & date</h3>
        <p className="font-body text-sm text-muted-foreground">Pick the experience that fits your vision, then select an available date (Sunday–Tuesday only).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map((opt) => {
          const selected = form.package === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => set("package", opt.value)}
              className={`relative text-left border-2 rounded-2xl p-4 transition-all ${
                selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
              }`}
            >
              {opt.featured && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">Popular</span>
              )}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-heading text-base font-bold leading-tight">{opt.value}</h4>
                {selected && <Check className="w-5 h-5 text-primary shrink-0" />}
              </div>
              <p className="font-heading text-sm font-semibold text-primary mb-1">{opt.price}</p>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground">{opt.guests}</span>
              </div>
              <p className="font-body text-xs text-muted-foreground">{opt.blurb}</p>
            </button>
          );
        })}
      </div>

      <div>
        <label className="font-body text-sm font-semibold mb-1 block">
          Event Date * <span className="font-normal text-muted-foreground">(Sunday–Tuesday only)</span>
        </label>
        <input type="date" className={input} value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} />
        {form.preferred_date && weekdayInvalid && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Calendar className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-body text-xs text-red-800">We're only available Sunday through Tuesday. Please pick one of those days.</span>
          </div>
        )}
        {form.preferred_date && !weekdayInvalid && dateBooked && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-body text-xs text-amber-800">This date is fully booked.</span>
            <button type="button" onClick={() => onJoinWaitlist?.(form.preferred_date, form.preferred_day)} className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900">
              Join Waitlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}