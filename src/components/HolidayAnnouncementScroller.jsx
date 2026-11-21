// Scrolling holiday-closure announcement strip.
// Renders nothing when no holiday closure is currently being announced.
// The track holds two identical halves so the -50% translate loops seamlessly.

import { getActiveHolidayClosure } from "@/lib/holidayClosures";

export default function HolidayAnnouncementScroller() {
  const closure = getActiveHolidayClosure();
  if (!closure) return null;

  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div
        className="flex w-max animate-marquee"
        aria-label={`${closure.headline} — ${closure.detail}`}
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex items-center gap-3 px-6 py-2.5 font-body text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] whitespace-nowrap"
              >
                <span>{closure.headline}</span>
                <span className="opacity-50">•</span>
                <span>{closure.detail}</span>
                <span className="opacity-50">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}