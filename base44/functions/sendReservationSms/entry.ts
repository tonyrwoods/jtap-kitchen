import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { sendSms } from '../../shared/sendSms.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Admin-triggered SMS confirmation for a reservation.
// Requires Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_FROM_NUMBER) to be set in app secrets, and a phone number on the
// reservation. Guests should opt in (reservation.sms_opt_in) before sending.
export default async function (req) {
  const base44 = createClientFromRequest(req);
  try {
    // Admin-only — no texting guests on behalf of others
    let user;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { reservation_id, body: customBody } = await req.json().catch(() => ({}));
    if (!reservation_id) return Response.json({ error: 'reservation_id is required' }, { status: 400 });

    // Fetch server-side — never trust client-supplied reservation data
    const reservation = await base44.entities.Reservation.get(reservation_id);
    if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });
    if (!reservation.phone) {
      return Response.json({ error: 'Reservation has no phone number on file' }, { status: 400 });
    }

    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    const fromNumber = secrets.get('TWILIO_FROM_NUMBER');
    if (!accountSid || !authToken || !fromNumber) {
      return Response.json(
        { error: 'Twilio credentials not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in app secrets.' },
        { status: 500 }
      );
    }

    const dateObj = new Date(reservation.date + 'T00:00:00');
    const formattedDate = isNaN(dateObj.getTime())
      ? reservation.date
      : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const firstName = (reservation.guest_name || '').split(' ')[0] || 'there';

    const body = customBody && customBody.trim()
      ? customBody.trim()
      : `JTAP Kitchen: Hi ${firstName}, your reservation for ${reservation.party_size} on ${formattedDate} at ${reservation.time} is confirmed. We can't wait to host you! Questions? Call (901) 213-8085. Reply STOP to opt out.`;

    const smsRes = await sendSms({ to: reservation.phone, body, accountSid, authToken, fromNumber, base44 });
    if (smsRes?.opted_out) {
      return Response.json({ sent: false, opted_out: true, to: reservation.phone });
    }
    await base44.entities.Reservation.update(reservation_id, { sms_sent_at: new Date().toISOString() });

    return Response.json({ sent: true, to: reservation.phone });
  } catch (error) {
    console.error('sendReservationSms error:', error);
    await notifyAdmins(base44, {
      subject: 'Reservation SMS failed',
      body: `An SMS confirmation could not be sent.<br><br><strong>Error:</strong> ${esc(error.message)}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
}