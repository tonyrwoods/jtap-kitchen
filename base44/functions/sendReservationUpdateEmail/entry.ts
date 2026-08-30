import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: stop non-admins from emailing guests directly
    let user;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { reservation_id } = await req.json().catch(() => ({}));
    if (!reservation_id) return Response.json({ error: 'reservation_id is required' }, { status: 400 });

    // Fetch server-side — never trust client-supplied reservation data
    const reservation = await base44.entities.Reservation.get(reservation_id);
    if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });
    if (!reservation.email || !reservation.guest_name) {
      return Response.json({ error: 'Reservation is missing guest name or email' }, { status: 400 });
    }

    const dateObj = new Date(reservation.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const confirmNo = (reservation.id || '').substring(0, 8).toUpperCase();

    const subject = `Your Reservation Has Been Updated — ${formattedDate}`;
    const body_html = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Reservation Updated</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${esc(reservation.guest_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Your reservation at JTAP Kitchen has been updated. Please review your latest reservation details below.</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${esc(reservation.time)}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Party size:</strong> ${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</p>
        <p style="margin:0;font-size:14px;"><strong>Confirmation #:</strong> ${confirmNo}</p>
        ${reservation.special_requests ? `<p style="margin:12px 0 0;font-size:13px;color:#777;font-style:italic;"><strong>Requests:</strong> ${esc(reservation.special_requests)}</p>` : ''}
      </div>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 20px;">If you have any questions or need to make further changes, please contact us directly — we&apos;re happy to help.</p>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; 3397 Summer Ave., Memphis TN 38122 &middot; info@jtapkitchen.com &middot; (901) 213-8085</p>
    </div>
  </div>
</body></html>`;

    await sendTransactionalEmail(base44, { to: reservation.email, subject, body: body_html });

    return Response.json({ sent: true, email: reservation.email });
  } catch (error) {
    console.error('sendReservationUpdateEmail error:', error);
    await notifyAdmins(base44, {
      subject: 'Reservation update email failed',
      body: `An updated-reservation email could not be sent.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}<br><br>Please follow up with the guest directly.`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
}