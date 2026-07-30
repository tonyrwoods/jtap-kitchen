import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

// Convert "7:00 PM" → "19:00" (24-hour HH:MM) for ISO datetime parsing
function to24Hour(timeStr) {
  if (!timeStr) return '12:00';
  // Already 24-hour format (e.g., "19:00") — return padded
  if (/^\d{1,2}:\d{2}$/.test(timeStr) && !/AM|PM/i.test(timeStr)) {
    return timeStr.padStart(5, '0');
  }
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '12:00';
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow entity automations (no user) or admin manual trigger
  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}
  if (user && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const payload = await req.json();

  const reservationId = payload?.event?.entity_id;
  if (!reservationId) return Response.json({ error: 'No entity_id' }, { status: 400 });

  const reservation = await base44.asServiceRole.entities.Reservation.get(reservationId);
  if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });

  // Only send for Confirmed reservations with a future date
  if (reservation.status !== 'Confirmed') {
    return Response.json({ skipped: 'Not a confirmed reservation' });
  }

  const time24 = to24Hour(reservation.time);
  const resDate = new Date(`${reservation.date}T${time24}:00`);

  // Guard against unparseable date/time — never send a reminder with "Invalid Date"
  if (isNaN(resDate.getTime())) {
    return Response.json({ skipped: 'Invalid reservation date/time — reminder not sent' });
  }

  const now = new Date();
  const hoursUntil = (resDate - now) / (1000 * 60 * 60);

  // Only schedule reminder if the reservation is between 20–28 hours away
  if (hoursUntil < 20 || hoursUntil > 28) {
    return Response.json({ skipped: `${Math.round(hoursUntil)}h until reservation — outside reminder window` });
  }

  const formattedDate = resDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = resDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const body = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
        <h1 style="color:#c89b4f;font-size:22px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
        <p style="color:#888;font-size:12px;margin:8px 0 0;">Reservation Reminder</p>
      </div>
      <div style="padding:36px 32px;background:#faf9f7;">
        <h2 style="font-size:20px;margin:0 0 8px;">We'll see you tomorrow, ${reservation.guest_name}!</h2>
        <p style="color:#666;font-size:14px;margin:0 0 28px;">Your reservation at JTAP Kitchen is confirmed for tomorrow.</p>
        <div style="background:#fff;border:1px solid #e8e0d4;border-radius:12px;padding:24px;">
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Date</td><td style="padding:8px 0;font-weight:600;">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Time</td><td style="padding:8px 0;font-weight:600;">${formattedTime}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Party size</td><td style="padding:8px 0;font-weight:600;">${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</td></tr>
            ${reservation.special_requests ? `<tr><td style="padding:8px 0;color:#888;vertical-align:top;">Requests</td><td style="padding:8px 0;color:#555;font-style:italic;">${reservation.special_requests}</td></tr>` : ''}
          </table>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#888;">
          Need to make changes? Please contact us at <a href="mailto:info@jtapkitchen.com" style="color:#c89b4f;">info@jtapkitchen.com</a> or call <strong>901-233-4060</strong>.
        </p>
      </div>
      <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
        <p style="color:#555;font-size:12px;margin:0 0 4px;">JTAP Kitchen · Memphis, TN</p>
        <p style="color:#444;font-size:11px;margin:0;">© ${new Date().getFullYear()} JTAP Kitchen. All rights reserved.</p>
      </div>
    </div>`;

  await sendEmailViaGmail(base44, {
    to: reservation.email,
    from_name: 'JTAP Kitchen',
    subject: `Reminder: Your reservation tomorrow at ${formattedTime}`,
    body,
  });

  return Response.json({ sent: true, to: reservation.email });
});