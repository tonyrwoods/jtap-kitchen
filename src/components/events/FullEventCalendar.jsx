import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Map a calendar item to a display category + color classes
export function categoryFor(item) {
  if (item.kind === "promo") {
    return { label: "Private Event", dot: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-700" };
  }
  const MAP = {
    "Wine Tasting": { label: "Wine Tasting", dot: "bg-purple-500", chip: "bg-purple-100 text-purple-700" },
    "Tasting Menu": { label: "Tasting Menu", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700" },
    "Holiday Dinner": { label: "Holiday Dinner", dot: "bg-red-500", chip: "bg-red-100 text-red-700" },
    "Chef's Table": { label: "Chef's Table", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700" },
    "Cooking Class": { label: "Cooking Class", dot: "bg-green-500", chip: "bg-green-100 text-green-700" },
    "Special Occasion": { label: "Special Occasion", dot: "bg-pink-500", chip: "bg-pink-100 text-pink-700" },
    Other: { label: "Event", dot: "bg-gray-400", chip: "bg-muted text-muted-foreground" },
  };
  return MAP[item.type] || MAP.Other;
}

function sortByTime(a, b) {
  return (a.time || "99:99").localeCompare(b.time || "99:99");
}

export default function FullEventCalendar({ items, selectedDate, onDaySelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leading = Array(getDay(monthStart)).fill(null);
  const today = startOfDay(new Date());

  const itemsForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return items.filter((i) => i.date === dateStr).sort(sortByTime);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-lg md:text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 rounded-lg border border-border font-body text-xs font-medium hover:bg-muted transition-colors"
          >
            Today
          </button>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-muted rounded-lg transition-colors" aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-muted rounded-lg transition-colors" aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center font-body text-[11px] md:text-xs font-semibold text-muted-foreground py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {leading.map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[64px] md:min-h-[96px]" />
        ))}
        {days.map((day) => {
          const dayItems = itemsForDay(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayCell = isToday(day);
          const inMonth = isSameMonth(day, currentMonth);
          const isPast = isBefore(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDaySelect(day)}
              className={`min-h-[64px] md:min-h-[96px] rounded-lg p-1 md:p-1.5 text-left flex flex-col gap-1 border transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : isTodayCell
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-muted/40"
              } ${!inMonth || isPast ? "opacity-50" : ""}`}
            >
              <span className={`font-body text-xs font-semibold ${isTodayCell ? "text-primary" : "text-foreground"}`}>
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayItems.slice(0, 3).map((item) => {
                  const cat = categoryFor(item);
                  return (
                    <span key={item.id} className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded ${cat.chip} text-[10px] leading-tight truncate`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.dot}`} />
                      <span className="truncate">{item.title}</span>
                    </span>
                  );
                })}
                {/* Mobile dots */}
                <div className="flex sm:hidden gap-0.5 flex-wrap">
                  {dayItems.slice(0, 4).map((item) => {
                    const cat = categoryFor(item);
                    return <span key={item.id} className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />;
                  })}
                </div>
                {dayItems.length > 3 && (
                  <span className="hidden sm:block font-body text-[10px] text-muted-foreground pl-1">+{dayItems.length - 3} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-10">
          <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-body text-sm text-muted-foreground">No upcoming events scheduled.</p>
        </div>
      )}
    </div>
  );
}