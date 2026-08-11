import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

// Public event booking endpoint. Replaces the old client-side flow that
// created a Reservation and decremented Event.spots_available directly from
// a stale client snapshot — which let two concurrent bookings both pass the
// "spots available" check and overbook past capacity.
//
// The confirmation email is still sent by the existing "Reservation
// Confirmation Email" entity automation (fires on Reservation create), so
// this function only handles validation, rate limiting, and the atomic
// capacity decrement.
export default async function (req) {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event_id, guest_name, email, phone, party_size, special_requests } = body;
    const pSize = parseInt(party_size) || 1;

    if (!event_id || !guest_name || !email || !pSize) {
      return Response.json({ error: 'event_id, guest_name, email, and party_size are required' }, { status: 400 });
    }

    const rl = await enforceRateLimit(req, base44, 'event-booking', String(email).toLowerCase(), 3, 600000);
    if (rl) return rl;

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const event = events[0];
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (event.is_published === false) {
      return Response.json({ error: 'This event is no longer available for booking.' }, { status: 400 });
    }

    const available = event.spots_available || 0;
    if (pSize > available) {
      return Response.json({ error: `Only ${available} spot${available === 1 ? '' : 's'} available.` }, { status: 409 });
    }

    // Atomic conditional decrement: only apply $inc to documents that still
    // have enough spots, so two concurrent bookings can't both pass the check
    // and overbook. If the filter matched nothing (another request took the
    // remaining spots first), the value is unchanged and we reject.
    await base44.asServiceRole.entities.Event.updateMany(
      { id: event_id, spots_available: { $gte: pSize } },
      { $inc: { spots_available: -pSize } }
    );
    const afterEvents = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const after = afterEvents[0];
    if (after && after.spots_available === available) {
      return Response.json({ error: `Only ${after.spots_available} spot${after.spots_available === 1 ? '' : 's'} available.` }, { status: 409 });
    }

    // Paid events hold seats as "Pending Payment" — confirmed + emailed by the payment
    // webhook once the buyer pays. Free events confirm immediately as before.
    const isPaid = Number(event.price_per_guest) > 0;

    if (isPaid) {
      const reservation = await base44.asServiceRole.entities.Reservation.create({
        guest_name,
        email,
        phone: phone || '',
        date: event.date,
        time: event.time,
        party_size: pSize,
        special_requests: special_requests ? `[Event: ${event.title}] — ${special_requests}` : `[Event: ${event.title}]`,
        event_id: event_id,
        status: 'Pending Payment',
      });
      return Response.json({
        success: true,
        requires_payment: true,
        reservation_id: reservation.id,
        price_per_guest: Number(event.price_per_guest),
        party_size: pSize,
        spots_remaining: available - pSize,
      });
    }

    await base44.asServiceRole.entities.Reservation.create({
      guest_name,
      email,
      phone: phone || '',
      date: event.date,
      time: event.time,
      party_size: pSize,
      special_requests: special_requests || `Event: ${event.title}`,
      status: 'Pending',
    });

    return Response.json({ success: true, spots_remaining: available - pSize });
  } catch (error) {
    if (base44) {
      await notifyAdmins(base44, {
        subject: 'Event booking failed',
        body: `The submitEventBooking function threw an error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}