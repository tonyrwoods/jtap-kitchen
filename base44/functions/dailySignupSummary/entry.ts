import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {

  // Allow scheduled automations (no user) or admin manual trigger
  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}
  if (user && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [allUsers, admins] = await Promise.all([
    base44.asServiceRole.entities.User.list('-created_date', 500),
    base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 50),
  ]);

  const newUsers = allUsers.filter(u => new Date(u.created_date) >= yesterday);

  if (admins.length === 0) {
    return Response.json({ message: 'No admins found' });
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const userRows = newUsers.length > 0
    ? newUsers.map(u => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">${u.full_name || '—'}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${u.email}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${u.role || 'user'}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${new Date(u.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>`).join('')
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#888;">No new signups in the last 24 hours.</td></tr>`;

  const body = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
        <h1 style="color:#c89b4f;font-size:22px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
        <p style="color:#888;font-size:12px;margin:8px 0 0;">Daily Signup Summary</p>
      </div>
      <div style="padding:32px;background:#faf9f7;">
        <h2 style="font-size:18px;margin:0 0 6px;">${newUsers.length} New Signup${newUsers.length !== 1 ? 's' : ''}</h2>
        <p style="color:#888;font-size:13px;margin:0 0 24px;">${today}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f0ece6;">
              <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Name</th>
              <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Email</th>
              <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Role</th>
              <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Time</th>
            </tr>
          </thead>
          <tbody>${userRows}</tbody>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#aaa;">Total users in app: ${allUsers.length}</p>
      </div>
      <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
        <p style="color:#555;font-size:11px;margin:0;">© ${new Date().getFullYear()} JTAP Kitchen · Memphis, TN</p>
      </div>
    </div>`;

  const results = await Promise.allSettled(
    admins.map(admin =>
      sendEmailViaGmail(base44, {
        to: admin.email,
        subject: `Daily Signup Summary — ${newUsers.length} new signup${newUsers.length !== 1 ? 's' : ''} · ${today}`,
        body,
      })
    )
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    await notifyAdmins(base44, {
      subject: `Daily signup summary: ${failed}/${admins.length} admin email(s) failed`,
      body: `The daily signup summary could not be delivered to ${failed} of ${admins.length} admin recipient(s).<br><br>New signups today: ${newUsers.length}`,
    }).catch(() => {});
  }

  return Response.json({ sent: admins.length - failed, new_signups: newUsers.length });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Daily signup summary job crashed',
      body: `The daily signup summary job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});