const EVENT_TYPES = [
  "Birthday Party", "Corporate Event", "Wedding Reception",
  "Baby/Bridal Shower", "Graduation Party", "Holiday Party", "Other",
];
const input = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

export default function WizardStepContact({ form, set, talent, addons, estimatedTotal, packagePrice }) {
  const selectedTalent = talent.filter((t) => form.selected_talent_ids.includes(t.id));
  const selectedAddons = addons.filter((a) => form.selected_addon_ids.includes(a.id));
  const money = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Review & contact</h3>
        <p className="font-body text-sm text-muted-foreground">Confirm your selections and share your details.</p>
      </div>

      <div className="bg-muted/40 border border-border rounded-2xl p-5 space-y-3">
        <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground">Estimated Quote</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-body text-sm text-muted-foreground">
              {form.package} <span className="text-xs">(starting)</span>
            </span>
            <span className="font-heading text-sm font-semibold">{money(packagePrice)}</span>
          </div>
          {selectedTalent.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3">
              <span className="font-body text-sm text-muted-foreground">Talent · {t.name}</span>
              <span className="font-heading text-sm font-semibold">{money(t.base_rate)}</span>
            </div>
          ))}
          {selectedAddons.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3">
              <span className="font-body text-sm text-muted-foreground">Add-on · {a.name}</span>
              <span className="font-heading text-sm font-semibold">{money(a.price)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="font-body text-sm font-semibold">Estimated Total</span>
          <span className="font-heading text-lg font-bold text-primary">{money(estimatedTotal)}</span>
        </div>
        <p className="font-body text-xs text-muted-foreground">Final pricing is confirmed during planning. Talent and add-on rates are starting estimates.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Full Name *</label>
          <input className={input} value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
          <input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
          <input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(901) 555-0100" />
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Guest Count *</label>
          <input type="number" min="1" className={input} value={form.guest_count} onChange={(e) => set("guest_count", e.target.value)} placeholder="e.g. 40" />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm font-semibold mb-1 block">Event Type *</label>
          <select className={input} value={form.event_type} onChange={(e) => set("event_type", e.target.value)}>
            <option value="">Select type...</option>
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm font-semibold mb-1 block">Additional Details</label>
          <textarea rows={3} className={`${input} resize-none`} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Anything else we should know?" />
        </div>
      </div>
    </div>
  );
}