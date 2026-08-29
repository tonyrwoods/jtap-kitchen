import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';
import { buildWaitlistEmail, autoPromoteWaitlist } from '../../shared/eventRsvp.js';

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