import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event } = body;

    if (!event || event.type !== 'update') return Response.json({ skipped: true });
    if (event.entity_name !== 'EventInvite') return Response.json({ skipped: true });

    const inviteId = event?.data?.id;
    if (!inviteId) {
      return Response.json({ error: 'Missing invite id' }, { status: 400 });
    }

    // Fetch the invite from the database — do not trust client-supplied event data
    const invites = await base44.asServiceRole.entities.EventInvite.filter({ id: inviteId });
    const invite = invites[0];
    if (!invite) {
      return Response.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (!invite.promotion_id) {
      return Response.json({ error: 'Missing invite data' }, { status: 400 });
    }

    // Only create calendar event for confirmed RSVPs
    if (invite.rsvp_status !== 'Attending') {
      return Response.json({ skipped: 'RSVP is not Attending' });
    }

    // Skip if calendar event already created
    if (invite.calendar_event_id) {
      return Response.json({ skipped: 'Calendar event already exists' });
    }

    // Fetch the promotion for event details
    const promos = await base44.asServiceRole.entities.EventPromotion.filter({ id: invite.promotion_id });
    const promotion = promos[0];
    if (!promotion) {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }

    // Build event start/end times (default to 3-hour event if no end_time)
    const startTime = promotion.time || '18:00';
    let endTime = promotion.end_time;
    if (!endTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = hours + 3;
      endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const startDateTime = `${promotion.date}T${startTime}:00`;
    const endDateTime = `${promotion.date}T${endTime}:00`;

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Build calendar event description
    const descLines = [
      `Guest: ${invite.guest_name}`,
      `Email: ${invite.guest_email}`,
      `Party Size: ${invite.party_size || 1}`,
    ];
    if (invite.plus_ones) descLines.push(`Plus Ones: ${invite.plus_ones}`);
    if (invite.dietary_notes) descLines.push(`Dietary Notes: ${invite.dietary_notes}`);

    // Create calendar event on primary calendar
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `${promotion.title} — ${invite.guest_name} (Party of ${invite.party_size || 1})`,
        location: promotion.location_label || 'JTAP Kitchen — Memphis, TN',
        description: descLines.join('\n'),
        start: { dateTime: startDateTime, timeZone: 'America/Chicago' },
        end: { dateTime: endDateTime, timeZone: 'America/Chicago' },
      }),
    });

    const eventData = await response.json();
    if (!response.ok) {
      return Response.json({ error: 'Google Calendar API error', details: eventData }, { status: 500 });
    }

    // Save the calendar event ID to prevent duplicate creation
    await base44.asServiceRole.entities.EventInvite.update(invite.id, {
      calendar_event_id: eventData.id,
    });

    return Response.json({ success: true, calendar_event_id: eventData.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});