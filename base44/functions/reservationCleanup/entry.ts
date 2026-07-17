import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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

    return Response.json({
      success: true,
      pendingCancelled: pendingUpdated,
      confirmedCompleted: confirmedUpdated,
      totalProcessed: pendingUpdated + confirmedUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});