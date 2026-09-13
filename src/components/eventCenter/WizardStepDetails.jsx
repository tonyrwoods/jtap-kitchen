import { Clock } from "lucide-react";

const EVENT_TYPES = [
  "Birthday Party", "Corporate Event", "Wedding Reception",
  "Baby/Bridal Shower", "Graduation Party", "Holiday Party", "Other",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Flexible"];
const input = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

export default function WizardStepDetails({ form, set, dateBooked, onJoinWaitlist }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Tell us about your event</h3>
        <p className="font-body text-sm text-muted-foreground">Start with the basics — we'll tailor the rest from here.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Event Type *</label>
          <select className={input} value={form.event_type} onChange={(e) => set("event_type", e.target.value)}>
            <option value="">Select type...</option>
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Guest Count *</label>
          <input type="number" min="1" className={input} value={form.guest_count} onChange={(e) => set("guest_count", e.target.value)} placeholder="e.g. 40" />
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Preferred Day *</label>
          <select className={input} value={form.preferred_day} onChange={(e) => set("preferred_day", e.target.value)}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Preferred Date</label>
          <input type="date" className={input} value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} />
          {form.preferred_date && dateBooked && (
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
    </div>
  );
}