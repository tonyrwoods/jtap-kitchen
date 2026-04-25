import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, RotateCcw, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CHECKLIST_SECTIONS = [
  {
    title: "Front of House",
    color: "bg-blue-500",
    items: [
      "Unlock front doors and turn on entrance lights",
      "Set up host stand and reservation book",
      "Check all tables are properly set (silverware, glassware, napkins)",
      "Confirm table positions match floor plan",
      "Inspect chairs and booths for cleanliness",
      "Clean and polish mirrors and windows",
      "Check and restock menus (no tears, stains)",
      "Verify POS terminals are on and functioning",
      "Set background music and adjust volume",
      "Check restrooms are clean and stocked (soap, paper towels, toilet paper)",
    ],
  },
  {
    title: "Bar Setup",
    color: "bg-purple-500",
    items: [
      "Stock bar with ice",
      "Check and replenish liquor, wine, and beer levels",
      "Prep garnishes (citrus, herbs, olives, etc.)",
      "Clean and polish glassware",
      "Verify POS bar terminal is operational",
      "Check cocktail recipe cards are available",
      "Ensure bar mats and tools are in place",
      "Verify refrigeration units are at correct temperature",
    ],
  },
  {
    title: "Kitchen",
    color: "bg-orange-500",
    items: [
      "Turn on all kitchen equipment and verify temperatures",
      "Review daily reservations and estimated covers",
      "Brief kitchen team on specials and 86'd items",
      "Check walk-in cooler and freezer temperatures",
      "Verify all prep work from previous day is stored correctly",
      "Confirm delivery orders received and stored",
      "Check line is fully stocked and mise en place is complete",
      "Inspect all food for freshness and proper labeling",
      "Verify sanitation supplies are stocked at each station",
      "Test fire suppression and ensure hood fans are working",
    ],
  },
  {
    title: "Staff",
    color: "bg-green-500",
    items: [
      "Confirm all staff scheduled have checked in",
      "Conduct pre-shift meeting (specials, reservations, goals)",
      "Assign sections to servers and verify uniform compliance",
      "Ensure all staff have server books/pens/wine openers",
      "Review any VIP reservations or special occasions",
      "Confirm kitchen and FOH communication channels are clear",
    ],
  },
  {
    title: "Safety & Compliance",
    color: "bg-red-500",
    items: [
      "Confirm fire exits are clear and unlocked",
      "Check first aid kit is stocked",
      "Verify security cameras are operational",
      "Ensure all food temps are logged",
      "Confirm hand sanitizing stations are stocked",
      "Review any health or safety issues from previous shift",
    ],
  },
];

const ALL_ITEMS = CHECKLIST_SECTIONS.flatMap((s) =>
  s.items.map((item) => ({ section: s.title, item }))
);

export default function OpeningChecklistTab() {
  const today = format(new Date(), "yyyy-MM-dd");
  const storageKey = `opening-checklist-${today}`;

  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  const total = ALL_ITEMS.length;
  const completed = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((completed / total) * 100);

  const toggle = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const reset = () => {
    if (!confirm("Reset today's checklist? All checks will be cleared.")) return;
    setChecked({});
    toast.success("Checklist reset for today");
  };

  return (
    <div className="space-y-6">
      {/* Header / Progress */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Opening Checklist
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")} — resets daily</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">{completed} of {total} completed</span>
            <span className={`font-body text-sm font-semibold ${pct === 100 ? "text-green-600" : "text-primary"}`}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct === 100 && (
            <p className="font-body text-sm text-green-600 font-semibold text-center pt-1">
              ✓ Restaurant is ready to open!
            </p>
          )}
        </div>
      </div>

      {/* Sections */}
      {CHECKLIST_SECTIONS.map((section) => {
        const sectionChecked = section.items.filter((item) => checked[`${section.title}::${item}`]).length;
        return (
          <div key={section.title} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${section.color}`} />
                <h3 className="font-body font-semibold text-sm">{section.title}</h3>
              </div>
              <span className="font-body text-xs text-muted-foreground">
                {sectionChecked}/{section.items.length}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {section.items.map((item) => {
                const key = `${section.title}::${item}`;
                const isDone = !!checked[key];
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`font-body text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}