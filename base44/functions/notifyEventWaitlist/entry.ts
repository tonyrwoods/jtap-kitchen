import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support both manual invocation and entity automation trigger
    let preferred_date, preferred_day;

    if (body?.event?.type === 'update' && body?.data) {
      // Triggered by automation — extract date/day from the declined inquiry
      preferred_date = body.data.preferred_date;
      preferred_day = body.data.preferred_day;
    } else {
      // Manual invocation — requires admin
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      preferred_date = body.preferred_date;
      preferred_day = body.preferred_day;
    }

    // Fetch all waiting entries
    const allWaiting = await base44.asServiceRole.entities.EventWaitlist.filter({ status: 'Waiting' });

    const toNotify = allWaiting.filter(entry => {
      if (preferred_date && entry.preferred_date === preferred_date) return true;
      if (preferred_day && entry.preferred_day === preferred_day) return true;
      if (entry.preferred_day === 'Flexible') return true;
      return false;
    });

    if (toNotify.length === 0) {
      return Response.json({ notified: 0, message: 'No waiting entries matched.' });
    }

    const now = new Date().toISOString();
    const results = await Promise.all(
      toNotify.map(async (entry) => {
        const dateLabel = preferred_date
          ? new Date(preferred_date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })
          : preferred_day || 'a date you requested';

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: entry.email,
          subject: "Great News — A Spot Just Opened at JTAP Kitchen Event Center!",
          body: `Hi ${entry.contact_name},\n\nExciting news! A date has just become available at the JTAP Kitchen Event Center — ${dateLabel}.\n\nAs someone on our waitlist, you have first priority to claim this date. Please reach out to us as soon as possible to secure your booking before it's offered to others.\n\n📞 (555) 012-3456\n✉️ events@jtapkitchen.com\n\nWe'd love to host your event!\n\n— The JTAP Kitchen Events Team`,
        });

        await base44.asServiceRole.entities.EventWaitlist.update(entry.id, {
          status: 'Notified',
          notified_at: now,
        });

        return entry.email;
      })
    );

    return Response.json({ notified: results.length, emails: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});