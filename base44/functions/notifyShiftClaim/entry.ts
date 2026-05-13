import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { claimId } = await req.json();

    if (!claimId) {
      return Response.json({ error: 'Missing claimId' }, { status: 400 });
    }

    // Fetch the claim
    const claim = await base44.entities.ShiftClaim.get(claimId);

    // Notify original owner
    await base44.integrations.Core.SendEmail({
      to: claim.original_owner_email,
      subject: `Your Posted Shift - Claim from ${claim.claimed_by}`,
      body: `Hi ${claim.original_owner},\n\nYour posted shift for ${claim.shift_date} (${claim.shift_start_time} - ${claim.shift_end_time}) has been claimed by ${claim.claimed_by}.\n\nStatus: Pending Admin Approval\n\nThe administrator will review and finalize the swap.\n\nThanks,\nJTAP Kitchen`
    });

    // Notify admins
    const admins = await base44.entities.User.list();
    for (const admin of admins) {
      if (admin.role === 'admin') {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `[Admin] Shift Swap Claim - Review Required`,
          body: `Admin Alert,\n\nA shift swap claim requires your approval:\n\nOriginal Owner: ${claim.original_owner}\nClaimed By: ${claim.claimed_by}\nDate: ${claim.shift_date}\nTime: ${claim.shift_start_time} - ${claim.shift_end_time}\n\nPlease review and approve/reject in the admin dashboard.\n\nThanks,\nJTAP Kitchen`
        });
      }
    }

    return Response.json({ success: true, message: 'Notifications sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});