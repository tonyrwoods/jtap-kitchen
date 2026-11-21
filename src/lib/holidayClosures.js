// Holiday closure announcements.
// Each closure is announced for a lead window before the date, then the
// announcement disappears automatically once the closure day has passed.

const LEAD_DAYS = 30;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// 4th Thursday of November = Thanksgiving (US)
function thanksgivingOf(year) {
  const firstOfNov = new Date(year, 10, 1);
  const offset = (4 - firstOfNov.getDay() + 7) % 7; // 4 = Thursday
  return new Date(year, 10, 1 + offset + 21);
}

function closuresFor(year) {
  const thanksgiving = thanksgivingOf(year);
  const christmas = new Date(year, 11, 25);
  return [
    { key: `thanksgiving-${year}`, holiday: "Thanksgiving", closed: thanksgiving, reopen: addDays(thanksgiving, 1) },
    { key: `christmas-${year}`, holiday: "Christmas", closed: christmas, reopen: addDays(christmas, 1) },
  ];
}

const formatDate = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

/**
 * Returns the holiday closure that should be announced right now, or null.
 * The announcement starts LEAD_DAYS before the closure and stops the day after.
 */
export function getActiveHolidayClosure(now = new Date()) {
  const today = startOfDay(now);
  const year = today.getFullYear();
  const closures = [...closuresFor(year), ...closuresFor(year + 1)];

  const active = closures.find((closure) => {
    const opensAnnouncement = addDays(closure.closed, -LEAD_DAYS);
    const closesAnnouncement = startOfDay(closure.reopen); // gone once the closure day ends
    return today >= opensAnnouncement && today < closesAnnouncement;
  });

  if (!active) return null;

  return {
    key: active.key,
    headline: `JTAP Kitchen Closed for ${active.holiday} — ${formatDate(active.closed)}`,
    detail: `Regular hours resume ${formatDate(active.reopen)}`,
  };
}