import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Creates a Google Calendar event on the connected calendar when a
// PrivateRoomRental becomes Confirmed. Triggered by the
// "Add Confirmed Private Room to Google Calendar" workflow on
// PrivateRoomRental create/update. Idempotent: skips once
// calendar_event_id is set. Mirrors addReservationToCalendar.

const pad = (n) => String(n).padStart(2, '0');

function toTimeStr(time, fallback) {
  if (!time) return fallback;
  const s = String(time).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${pad(parseInt(m[1], 10))}:${m[2]}:00`;
  return fallback;
}

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
    if (event.entity_name !== 'PrivateRoomRental') {
      return Response.json({ skipped: true });
    }

    const rentalId = event?.data?.id;
    if (!rentalId) {
      return Response.json({ error: 'Missing rental id' }, { status: 400 });
    }

    // Fetch server-side — never trust the client-supplied event payload.
    const rentals = await base44.asServiceRole.entities.PrivateRoomRental.filter({ id: rentalId });
    const rental = rentals[0];
    if (!rental) {
      return Response.json({ error: 'Rental not found' }, { status: 404 });
    }
    if (rental.status !== 'Confirmed') {
      return Response.json({ skipped: 'Rental not confirmed' });
    }
    if (rental.calendar_event_id) {
      return Response.json({ skipped: 'Calendar event already exists' });
    }
    if (!rental.event_date) {
      return Response.json({ skipped: 'Rental has no date' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const startTime = toTimeStr(rental.start_time, '18:00:00');
    const endTime = toTimeStr(rental.end_time, '21:00:00');
    const startDateTime = `${rental.event_date}T${startTime}`;
    const endDateTime = `${rental.event_date}T${endTime}`;

    const descLines = [
      `Member: ${rental.member_name || ''}`,
      `Email: ${rental.member_email || ''}`,
      `Event Type: ${rental.event_type || 'Private Event'}`,
      `Guest Count: ${rental.guest_count || 'TBD'}`,
    ];
    if (rental.member_tier) descLines.push(`Tier: ${rental.member_tier}`);
    if (rental.rental_rate != null) descLines.push(`Rental Rate: $${Number(rental.rental_rate).toFixed(2)}`);
    if (rental.deposit_paid) descLines.push(`Deposit: Paid`);
    if (rental.min_fb_spend != null) descLines.push(`F&B Minimum: $${Number(rental.min_fb_spend).toFixed(2)}`);
    if (rental.av_needed) descLines.push(`AV Equipment: Yes`);
    if (rental.floral_needed) descLines.push(`Floral/Decor: Yes`);
    if (rental.preferred_server) descLines.push(`Preferred Server: ${rental.preferred_server}`);
    if (rental.special_requests) descLines.push(`Notes: ${rental.special_requests}`);

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `Private Room — ${rental.member_name || 'Booking'} (${rental.event_type || 'Event'})`,
        location: 'JTAP Kitchen — Memphis, TN',
        description: descLines.join('\n'),
        start: { dateTime: startDateTime, timeZone: 'America/Chicago' },
        end: { dateTime: endDateTime, timeZone: 'America/Chicago' },
      }),
    });

    const eventData = await response.json();
    if (!response.ok) {
      console.warn('addPrivateRoomToCalendar: Google Calendar API error', eventData);
      return Response.json({ error: 'Google Calendar API error', details: eventData }, { status: 502 });
    }

    await base44.asServiceRole.entities.PrivateRoomRental.update(rental.id, {
      calendar_event_id: eventData.id,
    });

    return Response.json({ success: true, calendar_event_id: eventData.id });
  } catch (error) {
    console.error('addPrivateRoomToCalendar error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}