import { useState, useEffect } from "react";
import { CheckCircle2, Circle, RotateCcw, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CHECKLIST_SECTIONS = [
  {
    title: "Financial & Accounting",
    color: "bg-green-500",
    items: [
      "Reconcile all bank accounts and credit card statements",
      "Review and finalize P&L statement for the year",
      "Close out any outstanding vendor invoices",
      "Collect and organize all W-9s from vendors",
      "Prepare 1099s for contractors paid over $600",
      "Review payroll records and confirm year-end totals",
      "Audit gift card liabilities and outstanding balances",
      "Calculate and document depreciation on equipment",
      "Review and update chart of accounts",
      "Schedule meeting with accountant/CPA for tax prep",
      "Back up all financial records and data",
    ],
  },
  {
    title: "Inventory & Purchasing",
    color: "bg-orange-500",
    items: [
      "Conduct full physical inventory count",
      "Write off expired or unsalvageable inventory",
      "Review vendor contracts and renegotiate if needed",
      "Identify top and bottom performing menu items by cost",
      "Audit par levels and adjust for upcoming season",
      "Clear and organize walk-in coolers and dry storage",
      "Inspect and document all equipment conditions",
      "Review liquor license and renew if expiring",
      "Evaluate supply chain and identify backup vendors",
    ],
  },
  {
    title: "Staff & HR",
    color: "bg-blue-500",
    items: [
      "Complete all annual employee performance reviews",
      "Update employee files and contact information",
      "Verify I-9 documents are current and on file",
      "Issue W-2s to all employees by January 31",
      "Review and update employee handbook if needed",
      "Audit PTO, sick day, and vacation balances",
      "Document any disciplinary actions taken during the year",
      "Plan staffing needs for Q1 of the new year",
      "Conduct staff satisfaction survey",
      "Review tip reporting compliance",
    ],
  },
  {
    title: "Operations & Compliance",
    color: "bg-yellow-500",
    items: [
      "Renew business license(s) if required",
      "Verify all food handler certifications are current",
      "Check health department inspection reports and address any issues",
      "Test and service all fire safety equipment",
      "Inspect and service HVAC system",
      "Service hood and grease traps",
      "Review and update insurance policies",
      "Audit POS system and archive old transaction data",
      "Update emergency contact list",
      "Review lease agreement and upcoming renewal terms",
    ],
  },
  {
    title: "Menu & Marketing",
    color: "bg-purple-500",
    items: [
      "Analyze top-selling and least-selling menu items",
      "Review menu pricing against food cost targets",
      "Plan seasonal menu changes for Q1",
      "Audit social media accounts and review analytics",
      "Review website content and update as needed",
      "Plan promotional calendar for the new year",
      "Evaluate loyalty program performance and adjust tiers",
      "Send year-in-review thank you email to customer list",
      "Review online reputation (Yelp, Google) and respond to any outstanding reviews",
      "Plan New Year's Eve and holiday promotions if applicable",
    ],
  },
  {
    title: "Facilities & Equipment",
    color: "bg-red-500",
    items: [
      "Deep clean all kitchen equipment (ovens, fryers, grills)",
      "Clean and organize all storage areas",
      "Inspect plumbing for leaks or slow drains",
      "Test all electrical outlets and lighting",
      "Replace any burnt-out bulbs or damaged fixtures",
      "Deep clean dining room including upholstery and carpets",
      "Inspect and clean exhaust vents",
      "Check and restock first aid kits",
      "Organize and label all cleaning supply storage",
      "Document any capital improvements made this year",
    ],
  },
];

const ALL_ITEMS = CHECKLIST_SECTIONS.flatMap((s) =>
  s.items.map((item) => ({ section: s.title, item }))
);

const YEAR = new Date().getFullYear();
const STORAGE_KEY = `eoy-checklist-${YEAR}`;

export default function EndOfYearChecklistTab() {
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const total = ALL_ITEMS.length;
  const completed = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((completed / total) * 100);

  const toggle = (key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const reset = () => {
    if (!confirm(`Reset the ${YEAR} end-of-year checklist? All checks will be cleared.`)) return;
    setChecked({});
    toast.success("End of year checklist reset");
  };

  return (
    <div className="space-y-6">
      {/* Header / Progress */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              End of Year Checklist — {YEAR}
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-0.5">
              Annual wrap-up tasks to close out the year strong. Progress is saved per year.
            </p>
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
              ✓ Year-end wrap-up complete — happy new year!
            </p>
          )}
        </div>
      </div>

      {/* Sections */}
      {CHECKLIST_SECTIONS.map((section) => {
        const sectionChecked = section.items.filter(
          (item) => checked[`${section.title}::${item}`]
        ).length;

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