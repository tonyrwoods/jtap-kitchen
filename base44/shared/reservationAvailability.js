// Robust reservation availability engine: day-aware service windows +
// turn-window cover counting. Shared by submitReservation (enforcement on
// booking) and getReservationAvailability (live slot status for the booking
// UI) so both ends always agree on what "full" means.

// Parse "5:00 PM", "10:30 AM", or "17:00" into minutes-from-midnight.
export function timeToMinutes(t) {
  if (t == null) return null;
  const s = String(t).trim().toUpperCase();
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    if (m12[3] === 'PM' && h !== 12) h += 12;
    if (m12[3] === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return null;
}

// Minutes-from-midnight -> "5:00 PM" (12-hour, matches the booking UI slot strings).
export function minutesToTime12(min) {
  let h = Math.floor(min / 60);
  const mm = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ap}`;
}

export function formatTime12(t) {
  const min = timeToMinutes(t);
  if (min === null) return t;
  return minutesToTime12(min);
}

// Service windows per day-of-week (0=Sun … 6=Sat) as {name, open, close} in
// minutes-from-midnight. Mirrors the slots offered by the booking UI
// (BookTable.jsx slotsForDate): Sat/Sun brunch+dinner, Mon/Thu/Fri
// lunch+dinner, Tue/Wed lunch only (dinner closed).
//   10:00=600, 14:00=840, 15:00=900, 17:00=1020, 22:00=1320
export function serviceWindowsForDay(dayOfWeek) {
  const brunch = { name: 'Brunch', open: 600, close: 840 };
  const lunch = { name: 'Lunch', open: 600, close: 900 };
  const dinner = { name: 'Dinner', open: 1020, close: 1320 };
  switch (dayOfWeek) {
    case 0: case 6: return [brunch, dinner];   // Sat & Sun: brunch + dinner
    case 2: case 3: return [lunch];            // Tue & Wed: lunch only (dinner closed)
    default: return [lunch, dinner];           // Mon, Thu, Fri: lunch + dinner
  }
}

// A requested reservation start time is valid if it falls within one of the
// day's service windows (inclusive of open, up to and including close).
export function isValidReservationTime(dayOfWeek, reqMinutes) {
  if (reqMinutes === null) return false;
  return serviceWindowsForDay(dayOfWeek).some((w) => reqMinutes >= w.open && reqMinutes <= w.close);
}

export function dayServiceLabel(dayOfWeek) {
  return serviceWindowsForDay(dayOfWeek).map((w) => w.name).join(' + ');
}

// The service window a requested start time falls into (null if outside all
// windows for that day).
export function windowForTime(dayOfWeek, reqMinutes) {
  if (reqMinutes === null) return null;
  return serviceWindowsForDay(dayOfWeek).find((w) => reqMinutes >= w.open && reqMinutes <= w.close) || null;
}

// Per-service max concurrent covers, falling back to the global max_capacity
// when a service-specific value is unset (0 / missing).
export function capacityForWindow(settings, windowName) {
  const s = settings || {};
  const fallback = Number(s.max_capacity) || 80;
  if (windowName === 'Brunch') return Number(s.brunch_capacity) || fallback;
  if (windowName === 'Lunch') return Number(s.lunch_capacity) || fallback;
  if (windowName === 'Dinner') return Number(s.dinner_capacity) || fallback;
  return fallback;
}

// Turn-window cover count: a reservation occupies covers from its start time
// for `durationMinutes`. Two reservations' seats overlap when their occupied
// intervals intersect. Summing party_size over all reservations whose
// interval overlaps the requested interval gives the concurrent covers the
// new party would join — the real capacity pressure, not just the exact slot.
export function overlappingCovers(reservations, reqMinutes, durationMinutes) {
  if (reqMinutes === null) return 0;
  const reqStart = reqMinutes;
  const reqEnd = reqMinutes + durationMinutes;
  let sum = 0;
  for (const r of reservations || []) {
    const rs = timeToMinutes(r.time);
    if (rs === null) continue;
    const re = rs + durationMinutes;
    if (rs < reqEnd && reqStart < re) {
      sum += Number(r.party_size) || 0;
    }
  }
  return sum;
}

// Reservation statuses that still hold seats. Cancelled and Completed parties
// no longer consume capacity.
export const ACTIVE_STATUSES = ['Confirmed', 'Pending', 'Pending Payment'];