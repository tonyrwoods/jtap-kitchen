import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

const OPENING_DATE = '2026-08-12';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { guest_name, email, phone, date, time, party_size, special_requests } = body;

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

    // Per-slot capacity check.
    const settings = await base44.asServiceRole.entities.AppSettings.list();
    const maxCapacity = settings[0]?.max_capacity || 80;
    const confirmed = await base44.asServiceRole.entities.Reservation.filter({ date, time, status: 'Confirmed' });
    const booked = confirmed.reduce((sum, r) => sum + (r.party_size || 0), 0);
    if (booked + Number(party_size) > maxCapacity) {
      return Response.json({ error: 'Sorry, we are fully booked for that time slot. Please choose a different time.' }, { status: 409 });
    }

    const confirm_token = crypto.randomUUID();
    const reservation = await base44.asServiceRole.entities.Reservation.create({
      guest_name,
      email,
      phone: phone || '',
      date,
      time,
      party_size: Number(party_size),
      special_requests: special_requests || '',
      status: 'Pending',
      confirm_token,
    });

    return Response.json({ success: true, reservation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}