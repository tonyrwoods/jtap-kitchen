import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { reservation_token, name, email } = await req.json();
    if (!reservation_token || !name || !email) {
      return Response.json({ error: 'reservation_token, name, email required' }, { status: 400 });
    }

    const reservations = await base44.asServiceRole.entities.Reservation.filter({ confirm_token: reservation_token });
    const reservation = reservations[0];
    if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });
    if (reservation.status !== 'Confirmed') {
      return Response.json({ error: 'Reservation must be confirmed before inviting companions' }, { status: 400 });
    }

    const token = crypto.randomUUID();
    await base44.asServiceRole.entities.ReservationInvite.create({
      reservation_id: reservation.id,
      guest_name: name,
      guest_email: email,
      invite_token: token,
      rsvp_status: 'Pending',
      invite_sent_at: new Date().toISOString(),
    });

    const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
    const rsvpUrl = `${origin}/reserve/${token}`;
    const dateStr = reservation.date
      ? new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : '';

    await sendEmailViaGmail(base44, {
      to: email,
      subject: `${reservation.guest_name} invited you to dinner at JTAP Kitchen`,
      body: buildEmail(reservation, name, dateStr, rsvpUrl),
      from_name: 'JTAP Kitchen',
    });

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildEmail(reservation, name, dateStr, rsvpUrl) {
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">You're Invited</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${name},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;"><strong>${reservation.guest_name}</strong> has invited you to join their table at JTAP Kitchen.</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>When:</strong> ${dateStr} at ${reservation.time}</p>
        <p style="margin:0;font-size:14px;"><strong>Party of:</strong> ${reservation.party_size}</p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${rsvpUrl}" style="display:inline-block;background:#C89B4F;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;">RSVP Now &rarr;</a>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com</p>
    </div>
  </div>
</body></html>`;
}