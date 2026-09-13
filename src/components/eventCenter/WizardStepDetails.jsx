const EVENT_TYPES = [
  "Birthday Party", "Corporate Event", "Wedding Reception",
  "Baby/Bridal Shower", "Graduation Party", "Holiday Party", "Other",
];
const input = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

export default function WizardStepDetails({ form, set }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Event details</h3>
        <p className="font-body text-sm text-muted-foreground">Tell us about your gathering.</p>
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
      </div>
    </div>
  );
}