import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Creates a Google Calendar event on the connected calendar when an
// EventCenterInquiry becomes Confirmed. Triggered by the
// "Add Confirmed Event Inquiry to Google Calendar" workflow on
// EventCenterInquiry create/update. Idempotent: skips once
// calendar_event_id is set. Mirrors addReservationToCalendar.

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
    if (event.entity_name !== 'EventCenterInquiry') {
      return Response.json({ skipped: true });
    }

    const inquiryId = event?.data?.id;
    if (!inquiryId) {
      return Response.json({ error: 'Missing inquiry id' }, { status: 400 });
    }

    // Fetch server-side — never trust the client-supplied event payload.
    const inquiries = await base44.asServiceRole.entities.EventCenterInquiry.filter({ id: inquiryId });
    const inquiry = inquiries[0];
    if (!inquiry) {
      return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    }
    if (inquiry.status !== 'Confirmed') {
      return Response.json({ skipped: 'Inquiry not confirmed' });
    }
    if (inquiry.calendar_event_id) {
      return Response.json({ skipped: 'Calendar event already exists' });
    }

    // Use event_date if set, otherwise fall back to preferred_date.
    const eventDate = inquiry.event_date || inquiry.preferred_date;
    if (!eventDate) {
      return Response.json({ skipped: 'Inquiry has no date' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const descLines = [
      `Contact: ${inquiry.contact_name || ''}`,
      `Email: ${inquiry.email || ''}`,
      `Guest Count: ${inquiry.guest_count || 'TBD'}`,
    ];
    if (inquiry.phone) descLines.push(`Phone: ${inquiry.phone}`);
    if (inquiry.event_type) descLines.push(`Type: ${inquiry.event_type}`);
    if (inquiry.package_name) descLines.push(`Package: ${inquiry.package_name}`);
    if (inquiry.estimated_total != null) descLines.push(`Estimated Total: $${Number(inquiry.estimated_total).toFixed(2)}`);
    if (inquiry.deposit_status) descLines.push(`Deposit: ${inquiry.deposit_status}`);
    if (inquiry.message) descLines.push(`Notes: ${inquiry.message}`);

    // All-day event — event center bookings don't carry a fixed time.
    const nextDay = new Date(eventDate + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 1);
    const endDate = nextDay.toISOString().slice(0, 10);

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `Event Center — ${inquiry.contact_name || 'Booking'} (${inquiry.guest_count || '?'} guests)`,
        location: 'JTAP Kitchen — Memphis, TN',
        description: descLines.join('\n'),
        start: { date: eventDate },
        end: { date: endDate },
      }),
    });

    const eventData = await response.json();
    if (!response.ok) {
      console.warn('addEventInquiryToCalendar: Google Calendar API error', eventData);
      return Response.json({ error: 'Google Calendar API error', details: eventData }, { status: 502 });
    }

    await base44.asServiceRole.entities.EventCenterInquiry.update(inquiry.id, {
      calendar_event_id: eventData.id,
    });

    return Response.json({ success: true, calendar_event_id: eventData.id });
  } catch (error) {
    console.error('addEventInquiryToCalendar error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}