import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { claimId, approved } = await req.json();

    if (!claimId) {
      return Response.json({ error: 'Missing claimId' }, { status: 400 });
    }

    // Fetch the claim
    const claim = await base44.entities.ShiftClaim.get(claimId);

    const status = approved ? 'APPROVED' : 'REJECTED';
    const actionVerb = approved ? 'approved' : 'rejected';

    // Notify claimed-by staff
    await sendTransactionalEmail(base44, {
      to: claim.claimed_by_email,
      subject: `Shift Swap ${status}`,
      body: `Hi ${claim.claimed_by},\n\nYour shift swap claim has been ${actionVerb}.\n\nOriginal Owner: ${claim.original_owner}\nDate: ${claim.shift_date}\nTime: ${claim.shift_start_time} - ${claim.shift_end_time}\n\n${approved ? 'The shift swap is now finalized. Please update your schedule accordingly.' : 'Your claim was not approved. You may try claiming another shift.'}\n\nThanks,\nJTAP Kitchen`
    });

    // Notify original owner
    await sendTransactionalEmail(base44, {
      to: claim.original_owner_email,
      subject: `Shift Swap ${status} - ${claim.claimed_by}`,
      body: `Hi ${claim.original_owner},\n\nYour shift swap request has been ${actionVerb}.\n\nClaimant: ${claim.claimed_by}\nDate: ${claim.shift_date}\nTime: ${claim.shift_start_time} - ${claim.shift_end_time}\n\n${approved ? `${claim.claimed_by} has been approved to take your shift.` : 'The swap was not approved. Your shift remains yours.'}\n\nThanks,\nJTAP Kitchen`
    });

    return Response.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});