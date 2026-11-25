import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeReceptionist, unauthorized } from '../../shared/receptionistAuth.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import {
  timeToMinutes, isValidReservationTime, dayServiceLabel,
  overlappingCovers, ACTIVE_STATUSES, windowForTime, capacityForWindow,
} from '../../shared/reservationAvailability.js';

const OPENING_DATE = '2026-08-12';

// AI receptionist tool: book a table for a guest who is on the phone.
// Enforces the same service-hours, capacity and duplicate rules as the website
// booking form. It never takes payment — deposits stay with the guest's own
// checkout link.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await authorizeReceptionist(req, base44))) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const guest_name = String(body.guest_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const date = String(body.date || '').trim();
    const time = String(body.time || '').trim();
    const partySize = parseInt(body.party_size, 10);

    if (!guest_name || !email || !phone || !date || !time || !partySize) {
      return Response.json({
        error: 'guest_name, email, phone, date, time and party_size are required',
      }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'That email address does not look valid. Please read it back to the guest.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
    }
    if (partySize < 1 || partySize > 30) {
      return Response.json({ error: 'party_size must be between 1 and 30. Larger parties are handled by the event team.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'receptionistBookTable', email, 5, 600000);
    if (limited) return limited;

    if (date < OPENING_DATE) {
      return Response.json({ error: 'Reservations open August 12, 2026. Please choose a date on or after that.' }, { status: 400 });
    }

    const reqMin = timeToMinutes(time);
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    if (reqMin === null || !isValidReservationTime(dayOfWeek, reqMin)) {
      const hours = dayServiceLabel(dayOfWeek);
      return Response.json({
        error: hours
          ? `That time is outside our service hours. On that day we serve ${hours}.`
          : 'Tuesdays and Wednesdays are reserved for Event Center private events, so we do not take table reservations those days. Offer another date, or hand off to the event team to book the Event Center.',
      }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Reservation.filter({ email, date, time });
    if (existing.find((r) => r.status !== 'Cancelled')) {
      return Response.json({
        error: 'That guest already has a reservation for this date and time.',
        duplicate: true,
      }, { status: 409 });
    }

    const settingsList = await base44.asServiceRole.entities.AppSettings.list();
    const settings = settingsList[0] || {};
    const durationMinutes = Number(settings.dining_duration_minutes) || 90;

    const win = windowForTime(dayOfWeek, reqMin);
    const capacity = capacityForWindow(settings, win?.name);
    const active = await base44.asServiceRole.entities.Reservation.filter({
      date,
      status: { $in: ACTIVE_STATUSES },
    });
    const covers = overlappingCovers(active, reqMin, durationMinutes);
    if (covers + partySize > capacity) {
      return Response.json({
        error: 'That time is fully booked. Offer the guest a different time.',
        full: true,
      }, { status: 409 });
    }

    const smsOptIn = body.sms_opt_in === true;
    const reservation = await base44.asServiceRole.entities.Reservation.create({
      guest_name,
      email,
      phone,
      date,
      time,
      party_size: partySize,
      special_requests: String(body.special_requests || '').trim(),
      sms_opt_in: smsOptIn,
      status: 'Confirmed',
      confirmed_at: new Date().toISOString(),
      confirm_token: crypto.randomUUID(),
      deposit_amount: 0,
      deposit_status: 'Unpaid',
      admin_notes: 'Booked by AI receptionist (phone)',
    });

    return Response.json({
      success: true,
      reservation_id: reservation.id,
      status: reservation.status,
      guest_name,
      date,
      time,
      party_size: partySize,
      sms_opt_in: smsOptIn,
      confirmation_email: 'A confirmation email is sent automatically.',
    });
  } catch (error) {
    console.error('receptionistBookTable error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}