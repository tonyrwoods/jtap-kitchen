import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

const OPENING_DATE = '2026-08-12';

// Parse "5:00 PM", "10:30 AM", or "17:00" into minutes-from-midnight.
function timeToMinutes(t) {
  if (!t) return null;
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

function formatTime12(t) {
  const min = timeToMinutes(t);
  if (min === null) return t;
  let h = Math.floor(min / 60);
  const mm = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ap}`;
}

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

    // Business-hours guard: reject any reservation outside of opening–closing time.
    const openingTime = settings[0]?.opening_time || '17:00';
    const closingTime = settings[0]?.closing_time || '22:00';
    const reqMin = timeToMinutes(time);
    const openMin = timeToMinutes(openingTime);
    const closeMin = timeToMinutes(closingTime);
    if (reqMin === null || openMin === null || closeMin === null ||
        reqMin < openMin || reqMin > closeMin) {
      return Response.json({ error: `Reservations are only available during business hours (${formatTime12(openingTime)}–${formatTime12(closingTime)}).` }, { status: 400 });
    }
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
      status: 'Confirmed',
      confirmed_at: new Date().toISOString(),
      confirm_token,
    });

    return Response.json({ success: true, reservation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}