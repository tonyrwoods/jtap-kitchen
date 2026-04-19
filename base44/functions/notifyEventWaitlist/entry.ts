import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { event_id, spots_opened } = await req.json();

    if (!event_id || !spots_opened) {
      return Response.json({ error: 'Missing event_id or spots_opened' }, { status: 400 });
    }

    // Get event details
    const event = await base44.entities.Event.filter({ id: event_id }, '', 1);
    if (!event || event.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = event[0];

    // Get waiting list entries (in order of creation)
    const waitlist = await base44.entities.EventWaitlist.filter(
      { event_id: event_id, status: 'Waiting' },
      'created_date',
      spots_opened
    );

    if (waitlist.length === 0) {
      return Response.json({ message: 'No one on waitlist' }, { status: 200 });
    }

    const notificationDate = new Date().toISOString().split('T')[0];
    let notified = 0;

    // Notify waitlist members
    for (const entry of waitlist) {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: entry.email,
        subject: `A Spot Opened Up! ${eventData.title}`,
        body: `Hi ${entry.guest_name},\n\nGreat news! A spot has opened up for "${eventData.title}" on ${eventData.date} at ${eventData.time}.\n\nYou requested a spot for ${entry.party_size} ${entry.party_size === 1 ? 'guest' : 'guests'}.\n\nTo secure your reservation, please visit our website and complete your booking within 24 hours.\n\nEvent Details:\n- Date: ${eventData.date}\n- Time: ${eventData.time}\n- Price: $${eventData.price_per_guest} per guest\n\nIf you're no longer interested, no action is needed.\n\nBest regards,\nJTAP Kitchen Team`,
      });

      // Update waitlist entry
      await base44.entities.EventWaitlist.update(entry.id, {
        status: 'Notified',
        notification_sent_date: notificationDate,
      });

      notified++;
    }

    return Response.json({
      success: true,
      message: `Notified ${notified} people on the waitlist`,
      notified,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});