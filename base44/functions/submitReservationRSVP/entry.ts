import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token, mode, action } = await req.json();
    if (!token || !mode || !action) {
      return Response.json({ error: 'token, mode, action required' }, { status: 400 });
    }

    if (mode === 'holder') {
      if (!['confirm', 'decline'].includes(action)) {
        return Response.json({ error: 'invalid action' }, { status: 400 });
      }
      const reservations = await base44.asServiceRole.entities.Reservation.filter({ confirm_token: token });
      const reservation = reservations[0];
      if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });

      const now = new Date().toISOString();
      const updates = action === 'confirm'
        ? { status: 'Confirmed', confirmed_at: now }
        : { status: 'Cancelled', declined_at: now };
      const updated = await base44.asServiceRole.entities.Reservation.update(reservation.id, updates);
      return Response.json({ success: true, reservation: updated });
    }

    if (mode === 'companion') {
      if (!['attending', 'declined'].includes(action)) {
        return Response.json({ error: 'invalid action' }, { status: 400 });
      }
      const invites = await base44.asServiceRole.entities.ReservationInvite.filter({ invite_token: token });
      const invite = invites[0];
      if (!invite) return Response.json({ error: 'Invite not found' }, { status: 404 });

      const updated = await base44.asServiceRole.entities.ReservationInvite.update(invite.id, {
        rsvp_status: action === 'attending' ? 'Attending' : 'Declined',
        rsvp_responded_at: new Date().toISOString(),
      });
      return Response.json({ success: true, invite: updated });
    }

    return Response.json({ error: 'invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}