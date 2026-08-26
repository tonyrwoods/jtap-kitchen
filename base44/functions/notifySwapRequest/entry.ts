import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Require an authenticated caller — the swap-request automation fires as the
  // staff member who created it. Reject anonymous requests entirely.
  let user;
  try { user = await base44.auth.me(); } catch (_) { user = null; }
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));

  const requestId = payload?.event?.entity_id;
  if (!requestId) {
    // Manual (non-automation) invocation requires admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    return Response.json({ error: 'No entity_id' }, { status: 400 });
  }

  const swapReq = await base44.asServiceRole.entities.ShiftSwapRequest.get(requestId);
  if (!swapReq) {
    return Response.json({ error: 'Request not found' }, { status: 404 });
  }

  const managers = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 50);
  if (!managers || managers.length === 0) {
    return Response.json({ message: 'No managers to notify' });
  }

  const year = new Date().getFullYear();
  const body = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
      <h1 style="color:#c89b4f;font-size:22px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
      <p style="color:#888;font-size:12px;margin:8px 0 0;">Shift Swap Request</p>
    </div>
    <div style="padding:32px;background:#faf9f7;">
      <h2 style="font-size:18px;margin:0 0 6px;">New Swap Request</h2>
      <p style="color:#666;font-size:14px;margin:0 0 24px;">A staff member has submitted a shift swap request that needs your approval.</p>
      <div style="background:#fff;border:1px solid #e8e0d4;border-radius:12px;padding:24px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;width:140px;">Requested by</td><td style="padding:8px 0;font-weight:600;">${esc(swapReq.requester_staff_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Their shift</td><td style="padding:8px 0;">${swapReq.requester_shift_date} &middot; ${swapReq.requester_shift_block}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Swap with</td><td style="padding:8px 0;font-weight:600;">${esc(swapReq.target_staff_name)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Their shift</td><td style="padding:8px 0;">${swapReq.target_shift_date} &middot; ${swapReq.target_shift_block}</td></tr>
          ${swapReq.reason ? '<tr><td style="padding:8px 0;color:#888;vertical-align:top;">Reason</td><td style="padding:8px 0;color:#555;font-style:italic;">' + esc(swapReq.reason) + '</td></tr>' : ''}
        </table>
      </div>
      <p style="font-size:13px;color:#888;">Log in to the Kitchen Dashboard to approve or deny this request.</p>
    </div>
    <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
      <p style="color:#555;font-size:11px;margin:0;">&#169; ${year} JTAP Kitchen &middot; Memphis, TN</p>
    </div>
  </div>`;

  for (const m of managers) {
    await sendTransactionalEmail(base44, {
      to: m.email,
      from_name: 'JTAP Kitchen Staff',
      subject: 'Shift Swap Request: ' + swapReq.requester_staff_name + ' and ' + swapReq.target_staff_name,
      body: body,
    });
  }

  return Response.json({ notified: managers.length });
});