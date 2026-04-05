import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

const LABELS = { en: "EN", fr: "FR", es: "ES" };

export default function LanguageSwitcher() {
  const { lang, setLanguage, languages } = useI18n();

  return (
    <div className="flex items-center gap-1 border border-border rounded-full px-2 py-1">
      <Globe className="w-3.5 h-3.5 text-muted-foreground mr-0.5" />
      {languages.map((l) => (
        <button
          key={l}
          onClick={() => setLanguage(l)}
          className={`px-2 py-0.5 rounded-full text-xs font-medium font-body transition-all ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}