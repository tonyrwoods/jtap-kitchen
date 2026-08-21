import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {

  // Only two callers are allowed to run this job:
  //  1. The scheduled workflow, which authenticates with a shared secret (no user context).
  //  2. An admin manually triggering it from the app (authenticated session).
  // Any other caller — including an unauthenticated request with no secret — is rejected.
  const body = await req.json().catch(() => ({}));
  const providedSecret = body?.secret;
  const expectedSecret = Deno.env.get('SCHEDULED_JOB_SECRET');
  const isValidScheduledCall = Boolean(expectedSecret) && providedSecret === expectedSecret;

  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}

  if (!isValidScheduledCall) {
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
  }

  // Compute target date: 2 days from today (YYYY-MM-DD)
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 2);
  const targetDateStr = target.toISOString().split('T')[0];

  // Find active promotions happening on the target date
  const promotions = await base44.asServiceRole.entities.EventPromotion.filter({
    date: targetDateStr,
    is_active: true,
  });

  let sentCount = 0;
  const errors = [];

  for (const promotion of promotions) {
    // Find attending guests who haven't received a reminder yet
    const invites = await base44.asServiceRole.entities.EventInvite.filter({
      promotion_id: promotion.id,
      rsvp_status: 'Attending',
    });

    const pendingReminders = invites.filter(i => !i.reminder_sent_at && i.guest_email);

    for (const invite of pendingReminders) {
      try {
        await sendTransactionalEmail(base44, {
          to: invite.guest_email,
          from_name: 'JTAP Kitchen',
          subject: `Reminder: ${promotion.title} is in 2 days!`,
          body: buildReminderEmail(promotion, invite),
        });

        await base44.asServiceRole.entities.EventInvite.update(invite.id, {
          reminder_sent_at: new Date().toISOString(),
        });
        sentCount++;
      } catch (err) {
        errors.push({ email: invite.guest_email, error: err.message });
      }
    }
  }

  if (errors.length > 0) {
    await notifyAdmins(base44, {
      subject: `Event reminders: ${errors.length} failed (sent ${sentCount})`,
      body: `The 2-day event reminder job for <strong>${targetDateStr}</strong> hit ${errors.length} error(s).<br><br>Reminders sent: ${sentCount}<br><br><strong>Failed:</strong><br>${errors.map((e) => `${e.email} — ${e.error}`).join('<br>')}`,
    }).catch(() => {});
  }
  return Response.json({
    success: true,
    target_date: targetDateStr,
    promotions_found: promotions.length,
    reminders_sent: sentCount,
    errors,
  });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Event reminder job crashed',
      body: `The 2-day event reminder job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatTime(time) {
  if (!time) return '';
  const parts = time.split(':');
  const hour = parseInt(parts[0]);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${minute} ${ampm}`;
}

function buildReminderEmail(promotion, invite) {
  const dateStr = promotion.date
    ? new Date(promotion.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = formatTime(promotion.time);

  return `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
      <p style="color: #999; font-size: 13px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">Event Reminder</p>
    </div>
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 22px; margin: 0 0 12px;">Hi ${invite.guest_name},</h2>
      <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">
        We're looking forward to seeing you in <strong>2 days</strong> at <strong>${promotion.title}</strong>! Here's a quick reminder with all the details.
      </p>
      <div style="background: #f5f3f0; border-radius: 12px; padding: 20px; margin: 0 0 28px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; width: 100px;">Event:</td><td style="padding: 8px 0; font-weight: 600;">${promotion.title}</td></tr>
          ${dateStr ? `<tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0; font-weight: 600;">${dateStr}</td></tr>` : ''}
          ${timeStr ? `<tr><td style="padding: 8px 0; color: #888;">Time:</td><td style="padding: 8px 0; font-weight: 600;">${timeStr}${promotion.end_time ? ' – ' + formatTime(promotion.end_time) : ''}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #888;">Location:</td><td style="padding: 8px 0; font-weight: 600;">${promotion.location_label || 'JTAP Kitchen — Memphis, TN'}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Party Size:</td><td style="padding: 8px 0; font-weight: 600;">${invite.party_size || 1} guest${(invite.party_size || 1) !== 1 ? 's' : ''}</td></tr>
        </table>
      </div>
      ${promotion.host_message ? `<div style="background: #fffbf0; border-left: 4px solid #C89B4F; padding: 15px; border-radius: 4px; margin: 0 0 24px;"><p style="margin: 0; font-size: 13px; color: #666; font-style: italic;">${promotion.host_message}</p></div>` : ''}
      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        See you soon!<br/>
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431
      </p>
    </div>
  </div>
</body>
</html>`;
}