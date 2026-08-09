import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await req.json();
    const { event } = body;

    if (event.type !== 'update') return Response.json({ skipped: true });

    const invite = event.data;
    if (!invite || !invite.guest_email) {
      return Response.json({ error: 'Missing invite data' }, { status: 400 });
    }

    // Only send for valid RSVP responses
    if (!['Attending', 'Declined', 'Maybe'].includes(invite.rsvp_status)) {
      return Response.json({ skipped: true });
    }

    // Fetch the promotion for event details
    const promos = await base44.asServiceRole.entities.EventPromotion.filter({ id: invite.promotion_id });
    const promotion = promos[0];
    if (!promotion) {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }

    await sendTransactionalEmail(base44, {
      to: invite.guest_email,
      subject: `RSVP Confirmed — ${promotion.title}`,
      body: buildConfirmationEmail(promotion, invite),
    });

    return Response.json({ success: true, sent_to: invite.guest_email });
  } catch (error) {
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

function buildConfirmationEmail(promotion, invite) {
  const dateStr = promotion.date
    ? new Date(promotion.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = formatTime(promotion.time);

  const statusMessages = {
    'Attending': `We're thrilled you'll be joining us for <strong>${promotion.title}</strong>! Your party of ${invite.party_size || 1} is confirmed.`,
    'Declined': `We're sorry you can't make it to <strong>${promotion.title}</strong>. Thank you for letting us know — we hope to see you at a future event!`,
    'Maybe': `Thanks for your response regarding <strong>${promotion.title}</strong>. We'll hold your spot for now — please let us know as soon as you can confirm.`,
  };

  const detailsRows = [
    `<tr><td style="padding: 8px 0; color: #888; width: 100px;">Event:</td><td style="padding: 8px 0;">${promotion.title}</td></tr>`,
    dateStr ? `<tr><td style="padding: 8px 0; color: #888;">Date:</td><td style="padding: 8px 0;">${dateStr}</td></tr>` : '',
    timeStr ? `<tr><td style="padding: 8px 0; color: #888;">Time:</td><td style="padding: 8px 0;">${timeStr}${promotion.end_time ? ' – ' + formatTime(promotion.end_time) : ''}</td></tr>` : '',
    `<tr><td style="padding: 8px 0; color: #888;">Location:</td><td style="padding: 8px 0;">${promotion.location_label || 'JTAP Kitchen — Memphis, TN'}</td></tr>`,
    `<tr><td style="padding: 8px 0; color: #888;">Response:</td><td style="padding: 8px 0;"><strong>${invite.rsvp_status}</strong>${invite.rsvp_status === 'Attending' ? ` (Party of ${invite.party_size || 1})` : ''}</td></tr>`,
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
      <p style="color: #999; font-size: 13px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">RSVP Confirmed</p>
    </div>
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 22px; margin: 0 0 12px;">Hi ${invite.guest_name},</h2>
      <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">${statusMessages[invite.rsvp_status]}</p>
      <div style="background: #f5f3f0; border-radius: 12px; padding: 20px; margin: 0 0 28px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          ${detailsRows}
        </table>
      </div>
      ${invite.rsvp_status === 'Attending' && invite.dietary_notes ? `<div style="background: #fffbf0; border-left: 4px solid #C89B4F; padding: 15px; border-radius: 4px; margin: 0 0 24px;"><p style="margin: 0; font-size: 13px; color: #666;"><strong>Dietary Notes:</strong> ${invite.dietary_notes}</p></div>` : ''}
      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        Need to update your response? Visit your <a href="https://jtapkitchen.com/event-invite/${invite.invite_token}" style="color: #C89B4F;">RSVP link</a> anytime.<br/>
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431
      </p>
    </div>
  </div>
</body>
</html>`;
}