// Builds a day's bookable slots with live cover counts. Shared by the public
// booking UI (getReservationAvailability) and the AI receptionist so both see
// exactly the same availability.
import {
  serviceWindowsForDay, overlappingCovers, minutesToTime12,
  ACTIVE_STATUSES, capacityForWindow,
} from "./reservationAvailability.js";

export async function buildDayAvailability(base44, date, partySize) {
  const party = Math.max(1, parseInt(partySize, 10) || 1);
  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  const settingsList = await base44.asServiceRole.entities.AppSettings.list();
  const settings = settingsList[0] || {};
  const maxCapacity = Number(settings.max_capacity) || 80;
  const durationMinutes = Number(settings.dining_duration_minutes) || 90;
  const interval = Number(settings.slot_interval_minutes) || 30;

  const active = await base44.asServiceRole.entities.Reservation.filter({
    date,
    status: { $in: ACTIVE_STATUSES },
  });

  const slots = [];
  for (const w of serviceWindowsForDay(dayOfWeek)) {
    const capacity = capacityForWindow(settings, w.name);
    for (let m = w.open; m < w.close; m += interval) {
      const covers = overlappingCovers(active, m, durationMinutes);
      const remaining = Math.max(0, capacity - covers);
      slots.push({
        time: minutesToTime12(m),
        service: w.name,
        covers,
        remaining,
        available: remaining >= party,
      });
    }
  }

  return {
    date,
    max_capacity: maxCapacity,
    dining_duration_minutes: durationMinutes,
    slots,
  };
}