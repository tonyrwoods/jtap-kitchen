import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  serviceWindowsForDay, overlappingCovers, minutesToTime12, ACTIVE_STATUSES, capacityForWindow,
} from '../../shared/reservationAvailability.js';

// Public live availability for the booking UI. Returns, for a given date, the
// day's bookable slots with concurrent covers (across the dining turn
// window) and the remaining seats, so the UI can grey out full times before
// the guest signs in. Uses the service role to count ALL active reservations
// (RLS would otherwise hide other guests) and returns only aggregate counts —
// no personal data is exposed.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const date = String(body.date || '');
    const party = Math.max(1, parseInt(body.party_size, 10) || 1);
    if (!date) return Response.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 });

    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const settings = await base44.asServiceRole.entities.AppSettings.list();
    const maxCapacity = Number(settings[0]?.max_capacity) || 80;
    const durationMinutes = Number(settings[0]?.dining_duration_minutes) || 90;
    const interval = Number(settings[0]?.slot_interval_minutes) || 30;

    const active = await base44.asServiceRole.entities.Reservation.filter({ date, status: { $in: ACTIVE_STATUSES } });

    // Build the slot grid from the day's service windows at the configured
    // interval. Slots run from each window's open up to (but not including)
    // close, matching the times the booking UI offers.
    const slots = [];
    for (const w of serviceWindowsForDay(dayOfWeek)) {
      const capacity = capacityForWindow(settings[0], w.name);
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

    return Response.json({
      date,
      max_capacity: maxCapacity,
      dining_duration_minutes: durationMinutes,
      slots,
    });
  } catch (error) {
    console.error('getReservationAvailability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}