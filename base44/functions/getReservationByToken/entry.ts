import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const token = body?.token;
    if (!token) return Response.json({ error: 'token required' }, { status: 400 });

    const rl = await enforceRateLimit(req, base44, 'reservation-lookup', token, 20, 600000);
    if (rl) return rl;

    // Try reservation holder (confirm_token)
    const reservations = await base44.asServiceRole.entities.Reservation.filter({ confirm_token: token });
    if (reservations[0]) {
      const reservation = reservations[0];
      const companions = await base44.asServiceRole.entities.ReservationInvite.filter({ reservation_id: reservation.id });
      return Response.json({ mode: 'holder', reservation, companions });
    }

    // Try companion (invite_token)
    const invites = await base44.asServiceRole.entities.ReservationInvite.filter({ invite_token: token });
    if (invites[0]) {
      const invite = invites[0];
      const linked = await base44.asServiceRole.entities.Reservation.filter({ id: invite.reservation_id });
      return Response.json({ mode: 'companion', invite, reservation: linked[0] || null });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}