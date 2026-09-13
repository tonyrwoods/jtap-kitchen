const input = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="font-body text-sm text-muted-foreground">{label}</span>
      <span className="font-body text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function WizardStepContact({ form, set, talent, addons, estimatedTotal }) {
  const selectedTalent = talent.filter((t) => form.selected_talent_ids.includes(t.id));
  const selectedAddons = addons.filter((a) => form.selected_addon_ids.includes(a.id));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Your contact details</h3>
        <p className="font-body text-sm text-muted-foreground">Last step — tell us how to reach you and review your selections.</p>
      </div>

      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-0">
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Review</p>
        <Row label="Event type" value={form.event_type} />
        <Row label="Guests" value={form.guest_count} />
        <Row label="Preferred day" value={form.preferred_day} />
        <Row label="Preferred date" value={form.preferred_date} />
        <Row label="Package" value={form.package} />
        <Row label="Talent" value={selectedTalent.length ? selectedTalent.map((t) => t.name).join(", ") : "None selected"} />
        <Row label="Add-ons" value={selectedAddons.length ? selectedAddons.map((a) => `${a.name} ($${Number(a.price).toFixed(0)})`).join(", ") : "None selected"} />
        <Row label="Estimated extras" value={`$${estimatedTotal.toFixed(0)}`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Full Name *</label>
          <input className={input} value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Your name" required />
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
          <input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" required />
        </div>
        <div>
          <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
          <input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 000-0000" />
        </div>
      </div>
      <div>
        <label className="font-body text-sm font-semibold mb-1 block">Additional Details</label>
        <textarea rows={3} className={`${input} resize-none`} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Theme, special requests, dietary needs, etc." />
      </div>
      <p className="font-body text-xs text-muted-foreground">Estimated extras total covers selected talent and add-ons only. Package pricing is finalized with our events team.</p>
    </div>
  );
}