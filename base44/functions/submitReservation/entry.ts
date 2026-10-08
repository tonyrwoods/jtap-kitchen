import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import {
  timeToMinutes, isValidReservationTime, dayServiceLabel,
  overlappingCovers, ACTIVE_STATUSES, windowForTime, capacityForWindow,
} from '../../shared/reservationAvailability.js';

const OPENING_DATE = '2026-08-12';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in required to book a reservation.' }, { status: 401 });
    const body = await req.json();
    const { guest_name, email, phone, date, time, party_size, special_requests, sms_opt_in } = body;

    if (!guest_name || !email || !date || !time || !party_size) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'submitReservation', email.toLowerCase(), 3, 600000);
    if (limited) return limited;

    if (date < OPENING_DATE) {
      return Response.json({ error: 'Reservations open August 12, 2026. Please select a date on or after that.' }, { status: 400 });
    }

    // Duplicate-booking guard (service role — RLS would otherwise hide other guests' records).
    const existing = await base44.asServiceRole.entities.Reservation.filter({ email, date, time });
    if (existing.find(r => r.status !== 'Cancelled')) {
      return Response.json({ error: 'You already have a reservation for this date and time. Check your inbox for the confirmation link.' }, { status: 409 });
    }

    // Capacity + service-hours settings.
    const settings = await base44.asServiceRole.entities.AppSettings.list();
    const durationMinutes = Number(settings[0]?.dining_duration_minutes) || 90;

    // Day-aware service-hours guard: the reservation must start within one of
    // the day's service windows (brunch / lunch / dinner), matching the slots
    // the booking UI offers — replaces the stale single dinner-only window.
    const reqMin = timeToMinutes(time);
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    if (!isValidReservationTime(dayOfWeek, reqMin)) {
      return Response.json({ error: `Reservations for that day are available during ${dayServiceLabel(dayOfWeek)}. Please choose a valid time.` }, { status: 400 });
    }

    const win = windowForTime(dayOfWeek, reqMin);
    const capacity = capacityForWindow(settings[0], win?.name);

    // Turn-window cover count: sum party_size of every active reservation on
    // this date whose dining window overlaps the requested window, then
    // enforce the restaurant's max seating capacity.
    const active = await base44.asServiceRole.entities.Reservation.filter({ date, status: { $in: ACTIVE_STATUSES } });
    const covers = overlappingCovers(active, reqMin, durationMinutes);
    if (covers + Number(party_size) > capacity) {
      return Response.json({ error: 'Sorry, we are fully booked for that time. Please choose a different time.' }, { status: 409 });
    }

    // Deposit check: if enabled and party size meets threshold, require a deposit
    const depositEnabled = settings[0]?.reservation_deposit_enabled === true;
    const minPartySize = Number(settings[0]?.reservation_deposit_min_party_size) || 6;
    const depositRequired = depositEnabled && Number(party_size) >= minPartySize;
    const depositPerGuest = Number(settings[0]?.reservation_deposit_amount) || 10;
    const depositAmount = depositRequired ? depositPerGuest * Number(party_size) : 0;

    const confirm_token = crypto.randomUUID();
    const reservation = await base44.asServiceRole.entities.Reservation.create({
      guest_name,
      email,
      phone: phone || '',
      date,
      time,
      party_size: Number(party_size),
      special_requests: special_requests || '',
      sms_opt_in: !!sms_opt_in,
      status: depositRequired ? 'Pending Payment' : 'Confirmed',
      confirmed_at: depositRequired ? null : new Date().toISOString(),
      confirm_token,
      deposit_amount: depositAmount,
      deposit_status: depositRequired ? 'Unpaid' : 'Unpaid',
    });

    return Response.json({ success: true, reservation, deposit_required: depositRequired });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}