import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';
import { secrets } from 'base44:runtime';
import { sendSms } from '../../shared/sendSms.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const event = body.event || {};

    let reservation;
    if (event.type) {
      // Entity automation trigger — fetch the real record, never trust body.data
      if (event.type !== 'create') return Response.json({ skipped: true });
      if (!event.entity_id) return Response.json({ error: 'Missing entity_id' }, { status: 400 });
      reservation = await base44.asServiceRole.entities.Reservation.get(event.entity_id);
      if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });
    } else {
      // Manual invocation — requires admin (reject unauthenticated calls)
      let user;
      try { user = await base44.auth.me(); } catch (_) { user = null; }
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      reservation = body.data;
      if (!reservation) return Response.json({ error: 'Missing reservation data' }, { status: 400 });
    }

    // Paid event seats are held as "Pending Payment" — don't email until payment confirms.
    if (reservation.status === 'Pending Payment') {
      return Response.json({ skipped: true });
    }

    if (!reservation.email || !reservation.guest_name) {
      return Response.json({ error: 'Missing email or name' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
    const isEventBooking = reservation.special_requests?.startsWith('[Event:');
    const dateObj = new Date(reservation.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const firstName = (reservation.guest_name || '').split(' ')[0] || 'there';

    // SMS confirmation — only when the guest opted in and Twilio is configured.
    // Non-blocking: email already sent. Failures notify admins but don't fail the request.
    const maybeSendSms = async (smsBody) => {
      if (!reservation.sms_opt_in || !reservation.phone) return false;
      const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
      const authToken = secrets.get('TWILIO_AUTH_TOKEN');
      const fromNumber = secrets.get('TWILIO_FROM_NUMBER');
      if (!accountSid || !authToken || !fromNumber) return false;
      try {
        const smsRes = await sendSms({ to: reservation.phone, body: smsBody, accountSid, authToken, fromNumber, base44 });
        if (smsRes?.opted_out) return false;
        await base44.asServiceRole.entities.Reservation.update(reservation.id, { sms_sent_at: new Date().toISOString() });
        return true;
      } catch (err) {
        await notifyAdmins(base44, {
          subject: 'Reservation SMS confirmation failed',
          body: `Could not text ${esc(reservation.guest_name)} (${esc(reservation.phone)}):<br>${esc(err.message)}`,
        }).catch(() => {});
        return false;
      }
    };

    // Regular reservations still pending confirmation: send a "please confirm" RSVP email.
    // Auto-confirmed reservations (status === 'Confirmed') skip this and get a confirmation email below.
    if (!isEventBooking && reservation.confirm_token && reservation.status === 'Pending') {
      const rsvpUrl = `${origin}/reserve/${reservation.confirm_token}`;
      const subject = `Please Confirm Your Reservation — ${formattedDate}`;
      const body_html = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Confirm Your Reservation</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${esc(reservation.guest_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Thank you for requesting a table at JTAP Kitchen. Please confirm your reservation below so we can hold your table.</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${reservation.time}</p>
        <p style="margin:0;font-size:14px;"><strong>Party size:</strong> ${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</p>
        ${reservation.special_requests ? `<p style="margin:12px 0 0;font-size:13px;color:#777;font-style:italic;"><strong>Requests:</strong> ${esc(reservation.special_requests)}</p>` : ''}
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${rsvpUrl}" style="display:inline-block;background:#C89B4F;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;">Confirm Your Reservation &rarr;</a>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">Can't make it? You can cancel through the link above. JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431</p>
    </div>
  </div>
</body></html>`;
      await sendTransactionalEmail(base44, { to: reservation.email, subject, body: body_html, from_name: 'JTAP Kitchen' });
      // Admin notification
      await sendTransactionalEmail(base44, {
        to: 'info@jtapkitchen.com',
        subject: `New Reservation — ${reservation.guest_name}, ${formattedDate} at ${reservation.time}`,
        body: `New reservation request:<br><br><strong>${esc(reservation.guest_name)}</strong> (${esc(reservation.email)})<br>Phone: ${esc(reservation.phone || 'N/A')}<br>Date: ${formattedDate}<br>Time: ${reservation.time}<br>Party: ${reservation.party_size}<br>Requests: ${esc(reservation.special_requests || 'None')}<br><br><a href="${rsvpUrl}">View reservation</a>`,
        from_name: 'JTAP Kitchen Reservations',
      }).catch(() => {});
      await maybeSendSms(`JTAP Kitchen: Hi ${firstName}, we received your reservation request for ${formattedDate} at ${reservation.time}, party of ${reservation.party_size}. Check your email to confirm. Questions? Call 901-213-8085. Reply STOP to opt out.`);
      return Response.json({ sent: true, email: reservation.email, type: 'rsvp_confirm' });
    }

    // Event bookings or legacy reservations: original confirmation email
    const subject = isEventBooking
      ? `Event Booking Confirmation - ${reservation.date}`
      : `Reservation Confirmation - ${formattedDate}`;

    const body_html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: linear-gradient(135deg, #C89B4F 0%, #A67C3F 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px;">
            ${isEventBooking ? '🎉 Event Booking Confirmed!' : '🍽️ Reservation Confirmed!'}
          </h1>
        </div>
        <div style="background: #f9f9f9; padding: 40px 20px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 20px; font-size: 16px;">Hi <strong>${esc(reservation.guest_name)}</strong>,</p>
          <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666;">
            ${isEventBooking ? 'Thank you for booking our special event! We\'re excited to welcome you.' : 'Thank you for your reservation! We look forward to hosting you.'}
          </p>
          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px; font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Reservation Details</h2>
            <div style="margin-bottom: 12px;">
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Date & Time</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${formattedDate} at ${reservation.time}</p>
            </div>
            <div style="margin-bottom: 12px;">
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Party Size</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Confirmation Number</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; font-family: monospace;">${reservation.id.substring(0, 8).toUpperCase()}</p>
            </div>
            ${reservation.special_requests ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Special Requests</p>
                <p style="margin: 0; font-size: 14px; font-style: italic;">${esc(reservation.special_requests)}</p>
              </div>` : ''}
          </div>
          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">If you need to cancel or modify your reservation, please contact us as soon as possible.</p>
          <p style="margin: 20px 0 0; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">© JTAP Kitchen. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendTransactionalEmail(base44, {
      to: reservation.email,
      subject: subject,
      body: body_html,
      from_name: 'JTAP Kitchen'
    });
    // Admin notification
    await sendTransactionalEmail(base44, {
      to: 'info@jtapkitchen.com',
      subject: `New Reservation — ${reservation.guest_name}, ${formattedDate} at ${reservation.time}`,
      body: `New reservation:<br><br><strong>${esc(reservation.guest_name)}</strong> (${esc(reservation.email)})<br>Phone: ${esc(reservation.phone || 'N/A')}<br>Date: ${formattedDate}<br>Time: ${reservation.time}<br>Party: ${reservation.party_size}<br>Requests: ${esc(reservation.special_requests || 'None')}`,
      from_name: 'JTAP Kitchen Reservations',
    }).catch(() => {});

    await maybeSendSms(`JTAP Kitchen: Hi ${firstName}, your reservation (party of ${reservation.party_size}) on ${formattedDate} at ${reservation.time} is confirmed! We can't wait to host you. Questions? Call 901-213-8085. Reply STOP to opt out.`);
    return Response.json({ sent: true, email: reservation.email });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Reservation confirmation email failed',
      body: `A reservation confirmation email could not be sent.<br><br><strong>Error:</strong> ${error.message}<br><strong>Guest:</strong> ${reservation?.guest_name || 'unknown'} (${reservation?.email || 'n/a'})<br><strong>Time:</strong> ${new Date().toISOString()}<br><br>Please follow up with the guest directly.`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});