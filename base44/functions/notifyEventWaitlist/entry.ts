import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const event = body.event || {};

    // Support both manual invocation and entity automation trigger
    let preferred_date, preferred_day;

    if (event.type === 'update' && event.entity_id) {
      // Automation path: fetch the real inquiry and verify it was actually
      // declined (only admins can decline — prevents spoofing the trigger).
      const inquiry = await base44.asServiceRole.entities.EventCenterInquiry.get(event.entity_id);
      if (!inquiry) return Response.json({ error: 'Inquiry not found' }, { status: 404 });
      if (inquiry.status !== 'Declined') return Response.json({ skipped: 'Inquiry not declined' });
      preferred_date = inquiry.preferred_date;
      preferred_day = inquiry.preferred_day;
    } else {
      // Manual invocation — requires admin (reject unauthenticated calls)
      let user;
      try { user = await base44.auth.me(); } catch (_) { user = null; }
      if (!user || user.role !== 'admin') {
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

        await sendTransactionalEmail(base44, {
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