import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

// Generates a unique, human-readable discount code (e.g. JTAP-K7Q2M9) that has
// not already been handed out in this run.
function generateDiscountCode(prefix, used) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    let suffix = '';
    for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    code = `${prefix}-${suffix}`;
  } while (used.has(code));
  used.add(code);
  return code;
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

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Email every active Tap Room member a unique discount code + the event details
// for a promotion. Creates (or reuses) an EventInvite per member so the code
// and RSVP link are tracked on the guest list.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { promotion_id, discount_amount, code_prefix } = body;
    if (!promotion_id) {
      return Response.json({ error: 'promotion_id required' }, { status: 400 });
    }

    const promos = await base44.asServiceRole.entities.EventPromotion.filter({ id: promotion_id });
    const promotion = promos[0];
    if (!promotion) {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }

    const discount = parseFloat(discount_amount);
    const discountValue = isNaN(discount) ? (promotion.default_discount_amount || 0) : discount;
    const prefix = (code_prefix || 'JTAP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'JTAP';
    const origin = 'https://jtapkitchen.com';

    const members = await base44.asServiceRole.entities.TapRoomMember.list('-created_date', 500);
    const eligible = members.filter((m) => m.email && m.status !== 'Inactive');

    const usedCodes = new Set();
    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const member of eligible) {
      try {
        const email = member.email.toLowerCase();

        // Reuse an existing invite for this member + promotion, or create one.
        const existing = await base44.asServiceRole.entities.EventInvite.filter({
          promotion_id,
          guest_email: email,
        });
        let invite = existing[0];

        if (invite && invite.invite_sent_at && invite.discount_code) {
          skipped++;
          continue;
        }

        const code = generateDiscountCode(prefix, usedCodes);

        if (invite) {
          invite = await base44.asServiceRole.entities.EventInvite.update(invite.id, {
            guest_name: member.guest_name || invite.guest_name,
            discount_amount: discountValue,
            discount_code: code,
          });
        } else {
          invite = await base44.asServiceRole.entities.EventInvite.create({
            promotion_id,
            promotion_title: promotion.title,
            guest_name: member.guest_name || email.split('@')[0],
            guest_email: email,
            invite_token: crypto.randomUUID(),
            rsvp_status: 'Pending',
            party_size: 1,
            discount_amount: discountValue,
            discount_code: code,
          });
        }

        const rsvpUrl = `${origin}/event-invite/${invite.invite_token}`;
        await sendTransactionalEmail(base44, {
          to: email,
          subject: `Your Member Discount — ${promotion.title}`,
          body: buildDiscountEmail(promotion, invite, rsvpUrl, discountValue),
        });

        await base44.asServiceRole.entities.EventInvite.update(invite.id, {
          invite_sent_at: new Date().toISOString(),
        });
        sent++;
      } catch (err) {
        errors.push({ email: member.email, error: err.message });
      }
    }

    return Response.json({
      success: true,
      sent,
      skipped,
      total: eligible.length,
      discount_amount: discountValue,
      errors,
    });
  } catch (error) {
    console.error('sendLoyaltyDiscountCodes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildDiscountEmail(promotion, invite, rsvpUrl, discountValue) {
  const dateStr = promotion.date
    ? new Date(promotion.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = formatTime(promotion.time);
  const priceLine = promotion.price_per_guest > 0
    ? `$${Number(promotion.price_per_guest).toFixed(0)} per guest`
    : 'Complimentary';

  return `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
      <p style="color: #999; font-size: 13px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">Exclusive Member Offer</p>
    </div>
    ${promotion.banner_image_url ? `<div style="width:100%;height:200px;background-image:url('${promotion.banner_image_url}');background-size:cover;background-position:center;"></div>` : ''}
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 26px; margin: 0 0 8px; color: #1a1a1a;">${esc(promotion.title)}</h2>
      ${promotion.subtitle ? `<p style="color: #C89B4F; font-size: 15px; margin: 0 0 20px; font-style: italic;">${esc(promotion.subtitle)}</p>` : ''}
      <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">Hi ${esc(invite.guest_name)},</p>
      ${promotion.host_message ? `<p style="color: #555; line-height: 1.7; margin: 0 0 24px;">${esc(promotion.host_message)}</p>` : ''}
      <div style="background: #f5f3f0; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
        <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px;"><strong>&#128197;</strong> ${dateStr}${timeStr ? ' at ' + timeStr : ''}</p>
        <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px;"><strong>&#128205;</strong> ${esc(promotion.location_label || 'JTAP Kitchen — Memphis, TN')}</p>
        <p style="margin: 0; color: #1a1a1a; font-size: 14px;"><strong>&#127903;</strong> ${priceLine}</p>
      </div>
      <div style="background: #fffbf0; border: 2px dashed #C89B4F; border-radius: 12px; padding: 22px; text-align: center; margin: 0 0 28px;">
        <p style="color: #888; font-size: 12px; margin: 0 0 6px; letter-spacing: 1px; text-transform: uppercase;">Your unique discount code</p>
        <p style="color: #C89B4F; font-size: 30px; font-weight: 700; margin: 0 0 8px; letter-spacing: 3px;">${esc(invite.discount_code)}</p>
        ${discountValue > 0 ? `<p style="color: #1a6b3a; font-size: 14px; margin: 0;">Worth $${Number(discountValue).toFixed(0)} off your reservation</p>` : ''}
        <p style="color: #999; font-size: 12px; margin: 10px 0 0;">Mention this code when you RSVP or present it at the event.</p>
      </div>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${rsvpUrl}" style="display: inline-block; background: #C89B4F; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-family: Inter, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
          RSVP Now &rarr;
        </a>
      </div>
      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-213-8085
      </p>
    </div>
  </div>
</body>
</html>`;
}