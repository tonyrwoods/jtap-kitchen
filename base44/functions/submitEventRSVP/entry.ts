import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

    const invites = await base44.asServiceRole.entities.EventInvite.filter({ invite_token: token });
    const invite = invites[0];
    if (!invite) {
      return Response.json({ error: 'Invite not found' }, { status: 404 });
    }

    const size = rsvp_status === 'Attending' ? (parseInt(party_size) || 1) : 0;

    // Capacity check: don't exceed the event's max_guests
    if (rsvp_status === 'Attending') {
      const promotions = await base44.asServiceRole.entities.EventPromotion.filter({ id: invite.promotion_id });
      const promotion = promotions[0];
      if (promotion && promotion.max_guests) {
        const allAttending = await base44.asServiceRole.entities.EventInvite.filter({
          promotion_id: invite.promotion_id,
          rsvp_status: 'Attending',
        });
        const currentTotal = allAttending
          .filter((i) => i.id !== invite.id)
          .reduce((sum, i) => sum + (i.party_size || 1), 0);
        if (currentTotal + size > promotion.max_guests) {
          return Response.json({ error: 'This event has reached capacity. Please contact us to join the waitlist.' }, { status: 400 });
        }
      }
    }

    const updated = await base44.asServiceRole.entities.EventInvite.update(invite.id, {
      rsvp_status,
      party_size: size,
      plus_ones: plus_ones || '',
      dietary_notes: dietary_notes || '',
      rsvp_responded_at: new Date().toISOString(),
    });

    return Response.json({ success: true, invite: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}