import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Save, Hourglass, Users, Clock } from "lucide-react";

// Admin editor for the reservation availability engine's tuning knobs:
// per-service seating capacities, dining turn duration, slot interval, and
// max online party size. All values persist to the single AppSettings record
// the engine reads server-side, so changes take effect immediately for both
// booking enforcement (submitReservation) and live slot status
// (getReservationAvailability).

const FIELDS = [
  { key: "max_capacity", label: "Global Max Seating Capacity", group: "Capacity", help: "Fallback for any service without its own value." },
  { key: "brunch_capacity", label: "Brunch Capacity", group: "Capacity", help: "Sat/Sun 10:00–14:00. 0 = use global." },
  { key: "lunch_capacity", label: "Lunch Capacity", group: "Capacity", help: "10:00–15:00. 0 = use global." },
  { key: "dinner_capacity", label: "Dinner Capacity", group: "Capacity", help: "17:00–22:00. 0 = use global." },
  { key: "dining_duration_minutes", label: "Dining Duration (min/turn)", group: "Turn", help: "How long a table counts as occupied." },
  { key: "slot_interval_minutes", label: "Slot Interval (minutes)", group: "Turn", help: "Spacing between bookable time slots." },
  { key: "max_reservation_party_size", label: "Max Online Party Size", group: "Turn", help: "Largest party bookable online." },
];

const GROUPS = ["Capacity", "Turn"];

export default function OperationsSettingsTab() {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.AppSettings.list();
    let rec = list[0];
    if (!rec) {
      rec = await base44.entities.AppSettings.create({ max_capacity: 80, brunch_capacity: 80, lunch_capacity: 80, dinner_capacity: 80, dining_duration_minutes: 90, slot_interval_minutes: 30, max_reservation_party_size: 10 });
    }
    setRecord(rec);
    setForm({
      max_capacity: rec.max_capacity ?? 80,
      brunch_capacity: rec.brunch_capacity ?? 0,
      lunch_capacity: rec.lunch_capacity ?? 0,
      dinner_capacity: rec.dinner_capacity ?? 0,
      dining_duration_minutes: rec.dining_duration_minutes ?? 90,
      slot_interval_minutes: rec.slot_interval_minutes ?? 30,
      max_reservation_party_size: rec.max_reservation_party_size ?? 10,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const data = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v) || 0]));
      const updated = await base44.entities.AppSettings.update(record.id, data);
      setRecord(updated);
      toast.success("Operations settings saved");
    } catch (e) {
      toast.error("Could not save settings");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const input = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-lg font-semibold">Reservation Availability Settings</h3>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-5">
          These values drive the live availability engine. Per-service capacities override the global max when set above 0; leave 0 to inherit the global value.
        </p>

        <div className="space-y-6">
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                {group === "Capacity" ? <Users className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {group}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.filter((f) => f.group === group).map((f) => (
                  <div key={f.key}>
                    <label className="font-body text-sm text-foreground mb-1 block">{f.label}</label>
                    <input
                      type="number"
                      min="0"
                      className={input}
                      value={form[f.key] ?? 0}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                    <p className="font-body text-xs text-muted-foreground mt-1">{f.help}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
          </button>
          <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5" /> Changes apply to live booking instantly
          </span>
        </div>
      </div>
    </div>
  );
}