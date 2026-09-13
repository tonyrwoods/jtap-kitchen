import { useState } from "react";
import { CheckCircle2, Star, Calendar } from "lucide-react";

const CATEGORIES = [
  "Wedding Planner", "Event Planner", "DJ", "Musician", "Photographer",
  "Florist", "MC / Host", "Clown / Entertainer", "Officiant", "Other",
];

function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WizardStepTalent({ form, set, talent, availability, preferredDate }) {
  const [filter, setFilter] = useState("All");

  const toggle = (id) =>
    set(
      "selected_talent_ids",
      form.selected_talent_ids.includes(id)
        ? form.selected_talent_ids.filter((x) => x !== id)
        : [...form.selected_talent_ids, id]
    );

  const visible = filter === "All" ? talent : talent.filter((t) => t.category === filter);
  const dateLabel = formatDate(preferredDate);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Choose talent from our network</h3>
        <p className="font-body text-sm text-muted-foreground">Optional — add DJs, photographers, planners and more. You can skip this and just book the package.</p>
      </div>

      {!preferredDate ? (
        <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-body text-xs text-muted-foreground">Pick an event date in Step 1 to see who's available.</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-colors ${
                filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {talent.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">No talent is listed right now. You can skip this step.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((t) => {
            const selected = form.selected_talent_ids.includes(t.id);
            const avail = availability[t.id];
            const unavailable = preferredDate && avail === false;
            const available = preferredDate && avail === true;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => !unavailable && toggle(t.id)}
                disabled={unavailable}
                className={`text-left border-2 rounded-2xl p-4 transition-all ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                } ${unavailable ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.name} className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body font-semibold text-foreground">{t.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{t.category}</span>
                      {t.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
                    </div>
                    <p className="font-body text-sm text-muted-foreground mt-0.5">
                      {t.base_rate ? `$${Number(t.base_rate).toFixed(0)} · ${t.rate_unit}` : "Rate on request"}
                    </p>
                    {t.bio && <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2">{t.bio}</p>}
                    {preferredDate && (
                      <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${unavailable ? "bg-red-100 text-red-700" : available ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {unavailable ? `Not available on ${dateLabel}` : `Available on ${dateLabel}`}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="font-body text-sm text-muted-foreground text-center py-4 col-span-full">No talent in this category right now.</p>
          )}
        </div>
      )}
      <p className="font-body text-xs text-muted-foreground">Talent rates are starting estimates and confirmed during planning.</p>
    </div>
  );
}