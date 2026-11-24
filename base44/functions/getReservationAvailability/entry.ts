import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildDayAvailability } from '../../shared/reservationSlots.js';

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

    // Slot grid comes from the shared builder, so the booking UI and the AI
    // receptionist always agree on what is available.
    return Response.json(await buildDayAvailability(base44, date, party));
  } catch (error) {
    console.error('getReservationAvailability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}