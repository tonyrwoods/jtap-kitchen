import { INVITE_TEMPLATES } from "@/lib/inviteTemplates";
import { Utensils, Coffee, Cake, Briefcase, Heart } from "lucide-react";

const ICONS = { Utensils, Coffee, Cake, Briefcase, Heart };

export default function InviteTemplateSelect({ value, onChange, disabled }) {
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-2">Invite Style</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {INVITE_TEMPLATES.map((t) => {
          const Icon = ICONS[t.icon] || Utensils;
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(t.id)}
              title={t.description}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border whitespace-nowrap text-xs font-body font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}