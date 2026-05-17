import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shiftId, approvedById } = await req.json();

    // Find and cancel conflicting shift requests and open shifts
    const shiftRequests = await base44.asServiceRole.entities.ShiftSwapRequest.filter({ target_shift_id: shiftId, status: "Pending" });
    const openShifts = await base44.asServiceRole.entities.OpenShift.filter({ shift_id: shiftId, status: "Open" });

    for (const req of shiftRequests) {
      await base44.asServiceRole.entities.ShiftSwapRequest.update(req.id, {
        status: "Cancelled",
        manager_note: "Auto-cancelled: shift already covered.",
      });
    }

    for (const shift of openShifts) {
      await base44.asServiceRole.entities.OpenShift.update(shift.id, {
        status: "Cancelled",
        description: "Auto-cancelled: shift already covered.",
      });
    }

    return Response.json({ success: true, cancelled: shiftRequests.length + openShifts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});