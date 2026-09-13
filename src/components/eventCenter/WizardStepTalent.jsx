import { CheckCircle2, Star, Calendar } from "lucide-react";

export default function WizardStepTalent({ form, set, talent, availability, preferredDate }) {
  const toggle = (id) =>
    set(
      "selected_talent_ids",
      form.selected_talent_ids.includes(id)
        ? form.selected_talent_ids.filter((x) => x !== id)
        : [...form.selected_talent_ids, id]
    );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-xl font-bold mb-1">Add talent from our network</h3>
        <p className="font-body text-sm text-muted-foreground">Optional — curate DJs, photographers, planners and more from our vetted partners.</p>
      </div>
      {!preferredDate && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-body text-xs text-muted-foreground">Pick a preferred date in Step 1 to see live availability for each talent.</span>
        </div>
      )}
      {talent.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">No talent is listed right now. You can skip this step.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {talent.map((t) => {
            const selected = form.selected_talent_ids.includes(t.id);
            const blocked = preferredDate && availability[t.id] === false;
            const confirmedAvail = preferredDate && availability[t.id] === true;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => !blocked && toggle(t.id)}
                disabled={blocked}
                className={`text-left border-2 rounded-2xl p-4 transition-all ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                } ${blocked ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${blocked ? "bg-red-100 text-red-700" : confirmedAvail ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {blocked ? "Unavailable" : confirmedAvail ? "Available" : "Likely available"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <p className="font-body text-xs text-muted-foreground">Talent rates are starting estimates and confirmed during planning.</p>
    </div>
  );
}