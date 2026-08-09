import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token, mode, action } = await req.json();
    if (!token || !mode || !action) {
      return Response.json({ error: 'token, mode, action required' }, { status: 400 });
    }

    const rl = await enforceRateLimit(req, base44, 'reservation-rsvp', token, 10, 600000);
    if (rl) return rl;

    if (mode === 'holder') {
      if (!['confirm', 'decline'].includes(action)) {
        return Response.json({ error: 'invalid action' }, { status: 400 });
      }
      const reservations = await base44.asServiceRole.entities.Reservation.filter({ confirm_token: token });
      const reservation = reservations[0];
      if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });

      const now = new Date().toISOString();
      const updates = action === 'confirm'
        ? { status: 'Confirmed', confirmed_at: now }
        : { status: 'Cancelled', declined_at: now };
      const updated = await base44.asServiceRole.entities.Reservation.update(reservation.id, updates);

      // Send confirmation email when the holder confirms
      if (action === 'confirm' && reservation.email) {
        const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
        const formattedDate = reservation.date
          ? new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          : '';
        const body = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#faf9f7;padding:40px 20px;color:#1a1a1a;">
  <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:28px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Reservation Confirmed</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">You are confirmed, ${reservation.guest_name}!</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Your table at JTAP Kitchen is confirmed. We look forward to hosting you.</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${reservation.time}</p>
        <p style="margin:0;font-size:14px;"><strong>Party size:</strong> ${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</p>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-233-4060</p>
    </div>
  </div>
</body></html>`;
        await sendTransactionalEmail(base44, {
          to: reservation.email,
          subject: `Reservation Confirmed — ${formattedDate} at ${reservation.time}`,
          body,
          from_name: 'JTAP Kitchen',
        }).catch(() => {});
      }

      return Response.json({ success: true, reservation: updated });
    }

    if (mode === 'companion') {
      if (!['attending', 'declined'].includes(action)) {
        return Response.json({ error: 'invalid action' }, { status: 400 });
      }
      const invites = await base44.asServiceRole.entities.ReservationInvite.filter({ invite_token: token });
      const invite = invites[0];
      if (!invite) return Response.json({ error: 'Invite not found' }, { status: 404 });

      const updated = await base44.asServiceRole.entities.ReservationInvite.update(invite.id, {
        rsvp_status: action === 'attending' ? 'Attending' : 'Declined',
        rsvp_responded_at: new Date().toISOString(),
      });

      // Notify the reservation holder that their companion responded
      const reservations = await base44.asServiceRole.entities.Reservation.filter({ id: invite.reservation_id });
      const reservation = reservations[0];
      if (reservation && reservation.email) {
        const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
        const formattedDate = reservation.date
          ? new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          : '';
        const isAttending = action === 'attending';
        const subject = isAttending
          ? `${invite.guest_name} confirmed — your ${formattedDate} reservation`
          : `${invite.guest_name} declined — your ${formattedDate} reservation`;
        const statusLine = isAttending
          ? '<span style="color:#2d7a2d;font-weight:600;">confirmed they are attending</span>'
          : '<span style="color:#a33;font-weight:600;">let you know they cannot make it</span>';
        const body = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#faf9f7;padding:40px 20px;color:#1a1a1a;">
  <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:28px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:24px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#888;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Companion RSVP Update</p>
    </div>
    <div style="padding:36px;">
      <h2 style="font-size:20px;margin:0 0 12px;">Hi ${reservation.guest_name},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;font-size:14px;">
        <strong>${invite.guest_name}</strong> (${invite.guest_email}) has ${statusLine} your dinner reservation.
      </p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0 0 6px;font-size:14px;"><strong>Time:</strong> ${reservation.time}</p>
        <p style="margin:0;font-size:14px;"><strong>Party of:</strong> ${reservation.party_size}</p>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${origin}/reserve/${reservation.confirm_token}" style="display:inline-block;background:#C89B4F;color:#fff;text-decoration:none;padding:12px 36px;border-radius:50px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;">View Your Reservation</a>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:24px 0 0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN</p>
    </div>
  </div>
</body></html>`;
        await sendTransactionalEmail(base44, {
          to: reservation.email,
          subject,
          body,
          from_name: 'JTAP Kitchen',
        }).catch(() => {});
      }

      return Response.json({ success: true, invite: updated });
    }

    return Response.json({ error: 'invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}