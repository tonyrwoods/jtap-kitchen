import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';
import { buildWaitlistEmail, autoPromoteWaitlist } from '../../shared/eventRsvp.js';

function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Public RSVP from the share-slug announcement page (e.g. posted to a Facebook
// Group). Unlike the token flow, there is no pre-existing invite — we create
// one as Pending, then update it to the final status so the existing RSVP
// confirmation workflow fires (same path as emailed invites).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { share_slug, promotion_id, guest_name, guest_email, rsvp_status, party_size, plus_ones, dietary_notes } = body;

    if (!guest_name || !guest_email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!rsvp_status || !['Attending', 'Declined', 'Maybe'].includes(rsvp_status)) {
      return Response.json({ error: 'Valid rsvp_status required (Attending, Declined, or Maybe)' }, { status: 400 });
    }

    const email = String(guest_email).trim().toLowerCase();
    const rl = await enforceRateLimit(req, base44, 'event-rsvp-public', email, 10, 600000);
    if (rl) return rl;

    // Resolve the promotion by share slug or id
    let promotion;
    if (share_slug) {
      const found = await base44.asServiceRole.entities.EventPromotion.filter({ share_slug });
      promotion = found[0];
    } else if (promotion_id) {
      const found = await base44.asServiceRole.entities.EventPromotion.filter({ id: promotion_id });
      promotion = found[0];
    }
    if (!promotion) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }
    if (promotion.is_active === false) {
      return Response.json({ error: 'This event is no longer accepting RSVPs' }, { status: 400 });
    }

    // RSVP deadline check (Chicago time, same as the page)
    if (promotion.rsvp_deadline) {
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
      if (todayStr > promotion.rsvp_deadline) {
        return Response.json({ error: 'The RSVP deadline for this event has passed' }, { status: 400 });
      }
    }

    const size = rsvp_status === 'Attending' ? (parseInt(party_size) || 1) : 0;

    // Reuse an existing invite for this email + promotion if one exists (allows
    // updating a response from the public link); otherwise create one as Pending.
    const existing = await base44.asServiceRole.entities.EventInvite.filter({
      promotion_id: promotion.id,
      guest_email: email,
    });
    let invite = existing[0];

    if (!invite) {
      invite = await base44.asServiceRole.entities.EventInvite.create({
        promotion_id: promotion.id,
        promotion_title: promotion.title,
        guest_name: String(guest_name).trim(),
        guest_email: email,
        invite_token: crypto.randomUUID(),
        rsvp_status: 'Pending',
        party_size: 1,
      });
    }

    // Capacity check: if Attending would exceed max_guests, waitlist instead.
    let waitlisted = false;
    if (rsvp_status === 'Attending' && promotion.max_guests) {
      const allAttending = await base44.asServiceRole.entities.EventInvite.filter({
        promotion_id: promotion.id,
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
      guest_name: String(guest_name).trim(),
      rsvp_status: waitlisted ? 'Waitlisted' : rsvp_status,
      party_size: size,
      plus_ones: plus_ones || '',
      dietary_notes: dietary_notes || '',
      rsvp_responded_at: new Date().toISOString(),
    });

    if (waitlisted) {
      // The RSVP-confirmation entity automation skips Waitlisted, so send a
      // dedicated waitlist email here.
      try {
        await sendTransactionalEmail(base44, {
          to: email,
          subject: `You're on the waitlist — ${promotion.title}`,
          body: buildWaitlistEmail(promotion, updated),
        });
      } catch (err) {
        await notifyAdmins(base44, {
          subject: 'Event waitlist email failed',
          body: `A guest was waitlisted but the waitlist confirmation email could not be sent.<br><br><strong>Guest:</strong> ${esc(guest_name)} &lt;${esc(email)}&gt;<br><strong>Event:</strong> ${esc(promotion.title)}<br><strong>Error:</strong> ${esc(err?.message || err)}`,
        }).catch(() => {});
      }
      return Response.json({ success: true, invite: updated, waitlisted: true });
    }

    // When someone declines, auto-promote waitlisted guests into freed capacity.
    if (rsvp_status === 'Declined' && promotion.max_guests) {
      await autoPromoteWaitlist(base44, promotion.id, promotion);
    }

    return Response.json({ success: true, invite: updated });
  } catch (error) {
    console.error('submitPublicEventRSVP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}