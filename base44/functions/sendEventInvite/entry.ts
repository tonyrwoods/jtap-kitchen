import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { promotion_id, invite_id, send_to_all } = await req.json();
    if (!promotion_id) {
      return Response.json({ error: 'promotion_id required' }, { status: 400 });
    }

    let promotions;
    try {
      promotions = await base44.asServiceRole.entities.EventPromotion.filter({ id: promotion_id });
    } catch {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }
    const promotion = promotions[0];
    if (!promotion) {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }

    let invites;
    if (send_to_all) {
      invites = await base44.asServiceRole.entities.EventInvite.filter({ promotion_id });
    } else if (invite_id) {
      invites = await base44.asServiceRole.entities.EventInvite.filter({ id: invite_id });
    } else {
      return Response.json({ error: 'invite_id or send_to_all required' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
    const subject = promotion.invite_email_subject || `You're Invited — ${promotion.title}`;
    let sent = 0;
    const errors = [];

    for (const invite of invites) {
      const rsvpUrl = `${origin}/event-invite/${invite.invite_token}`;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invite.guest_email,
          subject,
          body: buildInviteEmail(promotion, invite, rsvpUrl),
        });
        await base44.asServiceRole.entities.EventInvite.update(invite.id, {
          invite_sent_at: new Date().toISOString(),
        });
        sent++;
      } catch (err) {
        errors.push({ email: invite.guest_email, error: err.message });
      }
    }

    return Response.json({ success: true, sent, total: invites.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function formatTime(time) {
  if (!time) return '';
  const parts = time.split(':');
  const hour = parseInt(parts[0]);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${minute} ${ampm}`;
}

function buildInviteEmail(promotion, invite, rsvpUrl) {
  const dateStr = promotion.date
    ? new Date(promotion.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = formatTime(promotion.time);
  const priceLine = promotion.price_per_guest > 0
    ? `$${Number(promotion.price_per_guest).toFixed(0)} per guest`
    : 'Complimentary';
  const deadlineStr = promotion.rsvp_deadline
    ? new Date(promotion.rsvp_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : '';

  return `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
      <p style="color: #999; font-size: 13px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">You're Invited</p>
    </div>
    ${promotion.banner_image_url ? `<div style="width:100%;height:200px;background-image:url('${promotion.banner_image_url}');background-size:cover;background-position:center;"></div>` : ''}
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 26px; margin: 0 0 8px; color: #1a1a1a;">${promotion.title}</h2>
      ${promotion.subtitle ? `<p style="color: #C89B4F; font-size: 15px; margin: 0 0 20px; font-style: italic;">${promotion.subtitle}</p>` : ''}
      <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">Hi ${invite.guest_name},</p>
      ${promotion.host_message ? `<p style="color: #555; line-height: 1.7; margin: 0 0 24px;">${promotion.host_message}</p>` : ''}
      <div style="background: #f5f3f0; border-radius: 12px; padding: 20px; margin: 0 0 28px;">
        <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px;"><strong>&#128197;</strong> ${dateStr}${timeStr ? ' at ' + timeStr : ''}</p>
        <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px;"><strong>&#128205;</strong> ${promotion.location_label || 'JTAP Kitchen — Memphis, TN'}</p>
        <p style="margin: 0; color: #1a1a1a; font-size: 14px;"><strong>&#127903;</strong> ${priceLine}</p>
      </div>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${rsvpUrl}" style="display: inline-block; background: #C89B4F; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-family: Inter, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
          RSVP Now &rarr;
        </a>
      </div>
      ${deadlineStr ? `<p style="color: #999; font-size: 13px; text-align: center; margin: 0 0 16px;">Please RSVP by ${deadlineStr}.</p>` : ''}
      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431
      </p>
    </div>
  </div>
</body>
</html>`;
}