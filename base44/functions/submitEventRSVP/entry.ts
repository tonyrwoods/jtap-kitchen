import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token, rsvp_status, party_size, plus_ones, dietary_notes } = await req.json();

    if (!token) {
      return Response.json({ error: 'token required' }, { status: 400 });
    }
    if (!rsvp_status || !['Attending', 'Declined', 'Maybe'].includes(rsvp_status)) {
      return Response.json({ error: 'Valid rsvp_status required (Attending, Declined, or Maybe)' }, { status: 400 });
    }

    const rl = await enforceRateLimit(req, base44, 'event-rsvp', token, 10, 600000);
    if (rl) return rl;

    const invites = await base44.asServiceRole.entities.EventInvite.filter({ invite_token: token });
    const invite = invites[0];
    if (!invite) {
      return Response.json({ error: 'Invite not found' }, { status: 404 });
    }

    const promotions = await base44.asServiceRole.entities.EventPromotion.filter({ id: invite.promotion_id });
    const promotion = promotions[0];

    const size = rsvp_status === 'Attending' ? (parseInt(party_size) || 1) : 0;

    // Capacity check: if Attending would exceed max_guests, add to the waitlist
    // instead of rejecting outright.
    let waitlisted = false;
    if (rsvp_status === 'Attending' && promotion && promotion.max_guests) {
      const allAttending = await base44.asServiceRole.entities.EventInvite.filter({
        promotion_id: invite.promotion_id,
        rsvp_status: 'Attending',
      });
      const currentTotal = allAttending
        .filter((i) => i.id !== invite.id)
        .reduce((sum, i) => sum + (i.party_size || 1), 0);
      if (currentTotal + size > promotion.max_guests) {
        waitlisted = true;
      }
    }

    const updated = await base44.asServiceRole.entities.EventInvite.update(invite.id, {
      rsvp_status: waitlisted ? 'Waitlisted' : rsvp_status,
      party_size: size,
      plus_ones: plus_ones || '',
      dietary_notes: dietary_notes || '',
      rsvp_responded_at: new Date().toISOString(),
    });

    if (waitlisted) {
      // The RSVP-confirmation entity automation skips Waitlisted, so send a
      // dedicated waitlist email here.
      if (invite.guest_email && promotion) {
        try {
          await sendTransactionalEmail(base44, {
            to: invite.guest_email,
            subject: `You're on the waitlist — ${promotion.title}`,
            body: buildWaitlistEmail(promotion, updated),
          });
        } catch (err) {
          // email failure shouldn't fail the RSVP, but surface it so staff can follow up
          await notifyAdmins(base44, {
            subject: 'Event waitlist email failed',
            body: `A guest was waitlisted but the waitlist confirmation email could not be sent.<br><br><strong>Guest:</strong> ${invite.guest_name} &lt;${invite.guest_email}&gt;<br><strong>Event:</strong> ${promotion.title}<br><strong>Error:</strong> ${err?.message || err}`,
          }).catch(() => {});
        }
      }
      return Response.json({ success: true, invite: updated, waitlisted: true });
    }

    // When someone declines, auto-promote waitlisted guests into freed capacity.
    if (rsvp_status === 'Declined' && promotion && promotion.max_guests) {
      await autoPromoteWaitlist(base44, invite.promotion_id, promotion);
    }

    return Response.json({ success: true, invite: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Promotes the oldest waitlisted parties (that fit) into newly freed capacity.
// Promoted guests are updated to "Attending", which triggers the existing
// sendRsvpConfirmation entity automation to email them a confirmation.
async function autoPromoteWaitlist(base44, promotionId, promotion) {
  const allInvites = await base44.asServiceRole.entities.EventInvite.filter({ promotion_id: promotionId });
  const attendingTotal = allInvites
    .filter((i) => i.rsvp_status === 'Attending')
    .reduce((sum, i) => sum + (i.party_size || 1), 0);

  let available = Math.max(0, (promotion.max_guests || 0) - attendingTotal);
  if (available <= 0) return { promoted: 0 };

  const waitlisted = allInvites
    .filter((i) => i.rsvp_status === 'Waitlisted')
    .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));

  let promoted = 0;
  for (const w of waitlisted) {
    if (available <= 0) break;
    const wSize = w.party_size || 1;
    if (wSize > available) continue; // party too large to fit the freed slots right now
    await base44.asServiceRole.entities.EventInvite.update(w.id, {
      rsvp_status: 'Attending',
      rsvp_responded_at: new Date().toISOString(),
    });
    available -= wSize;
    promoted += 1;
  }
  return { promoted };
}

function buildWaitlistEmail(promotion, invite) {
  const dateStr = promotion.date
    ? new Date(promotion.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">You're on the Waitlist</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${escapeHtml(invite.guest_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;"><strong>${escapeHtml(promotion.title)}</strong> is currently at capacity, so we've added your party of ${invite.party_size || 1} to the waitlist${dateStr ? ` for ${dateStr}` : ''}.</p>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">If a spot opens up, we'll automatically confirm your attendance and email you right away — no action needed on your part.</p>
      <p style="color:#999;font-size:13px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">
        Need to change your response? Visit your <a href="https://jtapkitchen.com/event-invite/${invite.invite_token}" style="color:#C89B4F;">RSVP link</a> anytime.<br/>
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com
      </p>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}