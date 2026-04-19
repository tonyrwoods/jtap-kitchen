import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EventCalendar({ events, onDateSelect, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startingDayOfWeek).fill(null);

  const hasEvent = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.some(e => e.date === dateStr);
  };

  const getEventsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center font-body text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const hasEvents = hasEvent(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const eventCount = getEventsForDate(day).length;

          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-lg font-body text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                  : hasEvents
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full gap-0.5">
                <span>{format(day, "d")}</span>
                {hasEvents && <span className="text-xs">{eventCount}e</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}