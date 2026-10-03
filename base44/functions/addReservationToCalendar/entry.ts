import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Creates a Google Calendar event on the connected calendar when a Reservation
// becomes Confirmed (admin confirm or guest RSVP confirm). Triggered by the
// "Add Confirmed Reservation to Google Calendar" workflow on Reservation
// create/update. Idempotent: skips once calendar_event_id is set. Mirrors
// addRsvpToCalendar but for the Reservation entity.

function parseMin(time) {
  if (!time) return null;
  const s = String(time).trim().toUpperCase();
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    if (m12[3] === 'PM' && h !== 12) h += 12;
    if (m12[3] === 'AM' && h === 12) h = 0;
    return h * 60 + parseInt(m12[2], 10);
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return null;
}
const pad = (n) => String(n).padStart(2, '0');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { event } = body;
    if (!event || (event.type !== 'create' && event.type !== 'update')) {
      return Response.json({ skipped: true });
    }
    if (event.entity_name !== 'Reservation') {
      return Response.json({ skipped: true });
    }

    const resId = event?.data?.id;
    if (!resId) {
      return Response.json({ error: 'Missing reservation id' }, { status: 400 });
    }

    // Fetch server-side — never trust the client-supplied event payload.
    const reservations = await base44.asServiceRole.entities.Reservation.filter({ id: resId });
    const reservation = reservations[0];
    if (!reservation) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }
    if (reservation.status !== 'Confirmed') {
      return Response.json({ skipped: 'Reservation not confirmed' });
    }
    if (reservation.calendar_event_id) {
      return Response.json({ skipped: 'Calendar event already exists' });
    }
    if (!reservation.date) {
      return Response.json({ skipped: 'Reservation has no date' });
    }

    const startMin = parseMin(reservation.time);
    const startTime = startMin !== null ? `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}:00` : '18:00:00';
    const endMin = startMin !== null ? startMin + 90 : null;
    const endTime = endMin !== null ? `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}:00` : '20:00:00';
    const startDateTime = `${reservation.date}T${startTime}`;
    const endDateTime = `${reservation.date}T${endTime}`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const descLines = [
      `Guest: ${reservation.guest_name || ''}`,
      `Email: ${reservation.email || ''}`,
      `Party Size: ${reservation.party_size || 1}`,
    ];
    if (reservation.phone) descLines.push(`Phone: ${reservation.phone}`);
    if (reservation.special_requests) descLines.push(`Notes: ${reservation.special_requests}`);

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `Reservation — ${reservation.guest_name || 'Guest'} (Party of ${reservation.party_size || 1})`,
        location: 'JTAP Kitchen — Memphis, TN',
        description: descLines.join('\n'),
        start: { dateTime: startDateTime, timeZone: 'America/Chicago' },
        end: { dateTime: endDateTime, timeZone: 'America/Chicago' },
      }),
    });

    const eventData = await response.json();
    if (!response.ok) {
      console.warn('addReservationToCalendar: Google Calendar API error', eventData);
      return Response.json({ error: 'Google Calendar API error', details: eventData }, { status: 502 });
    }

    await base44.asServiceRole.entities.Reservation.update(reservation.id, {
      calendar_event_id: eventData.id,
    });

    return Response.json({ success: true, calendar_event_id: eventData.id });
  } catch (error) {
    console.error('addReservationToCalendar error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}