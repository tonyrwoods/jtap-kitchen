import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const today = new Date().toISOString().split('T')[0];

    // Fetch all reservations using service role
    const allReservations = await base44.asServiceRole.entities.Reservation.list('-created_date', 500);

    // Old Pending reservations → Cancelled (never confirmed by staff)
    const stalePending = allReservations.filter(
      (r) => r.status === 'Pending' && r.date && r.date < today
    );

    // Old Confirmed reservations → Completed (date has passed)
    const staleConfirmed = allReservations.filter(
      (r) => r.status === 'Confirmed' && r.date && r.date < today
    );

    let pendingUpdated = 0;
    let confirmedUpdated = 0;

    // Bulk update stale pending → Cancelled
    if (stalePending.length > 0) {
      const ids = stalePending.map((r) => r.id);
      const result = await base44.asServiceRole.entities.Reservation.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'Cancelled' } }
      );
      pendingUpdated = stalePending.length;
    }

    // Bulk update stale confirmed → Completed
    if (staleConfirmed.length > 0) {
      const ids = staleConfirmed.map((r) => r.id);
      const result = await base44.asServiceRole.entities.Reservation.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'Completed' } }
      );
      confirmedUpdated = staleConfirmed.length;
    }

    // Release seats held by abandoned "Pending Payment" event reservations (>24h old) and
    // restore their spots so other guests can book. (Checkout sessions are short-lived, so a
    // reservation still pending payment after 24h was abandoned.)
    const pendingPaymentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const abandonedPaid = allReservations.filter(
      (r) => r.status === 'Pending Payment' && r.created_date && r.created_date < pendingPaymentCutoff
    );
    let pendingPaymentReleased = 0;
    for (const r of abandonedPaid) {
      await base44.asServiceRole.entities.Reservation.update(r.id, { status: 'Cancelled' });
      if (r.event_id && r.party_size) {
        await base44.asServiceRole.entities.Event.updateMany(
          { id: r.event_id },
          { $inc: { spots_available: r.party_size } }
        );
      }
      pendingPaymentReleased++;
    }

    // Mark stale pending companion invites as Declined (reservation date passed)
    const allInvites = await base44.asServiceRole.entities.ReservationInvite.list('-created_date', 500);
    const passedIds = new Set(allReservations.filter((r) => r.date && r.date < today).map((r) => r.id));
    const staleInvites = allInvites.filter((i) => i.rsvp_status === 'Pending' && passedIds.has(i.reservation_id));
    let invitesDeclined = 0;
    if (staleInvites.length > 0) {
      await base44.asServiceRole.entities.ReservationInvite.updateMany(
        { _id: { $in: staleInvites.map((i) => i.id) } },
        { $set: { rsvp_status: 'Declined' } }
      );
      invitesDeclined = staleInvites.length;
    }

    return Response.json({
      success: true,
      pendingCancelled: pendingUpdated,
      confirmedCompleted: confirmedUpdated,
      pendingPaymentReleased,
      invitesDeclined,
      totalProcessed: pendingUpdated + confirmedUpdated + invitesDeclined + pendingPaymentReleased,
    });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Reservation cleanup job crashed',
      body: `The daily reservation cleanup job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});