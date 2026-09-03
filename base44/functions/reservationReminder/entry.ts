import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';
import { secrets } from 'base44:runtime';
import { sendSms } from '../../shared/sendSms.js';

// Send a reminder SMS when the guest opted in and Twilio is configured.
// Non-fatal: callers track their own errors separately.
async function sendReminderSms(to, body) {
  const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
  const authToken = secrets.get('TWILIO_AUTH_TOKEN');
  const fromNumber = secrets.get('TWILIO_FROM_NUMBER');
  if (!accountSid || !authToken || !fromNumber || !to) return;
  await sendSms({ to, body, accountSid, authToken, fromNumber });
}

// Scheduled daily automation — scans for confirmed reservations happening
// tomorrow and sends each guest a reminder (tracked via reminder_sent_at).
// Previously this was entity-triggered, which only fired at create/update
// time, so guests who booked days ahead never received a reminder.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Determine tomorrow's date string (YYYY-MM-DD). Runs at 09:00 local,
  // so the simple UTC-derived date aligns with the calendar date.
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Fetch confirmed and pending reservations scheduled for tomorrow that haven't been reminded yet.
  const confirmedRes = await base44.asServiceRole.entities.Reservation.filter({
    status: 'Confirmed',
    date: tomorrowStr,
  });
  const pendingRes = await base44.asServiceRole.entities.Reservation.filter({
    status: 'Pending',
    date: tomorrowStr,
  });

  const eligible = [...confirmedRes, ...pendingRes].filter((r) => !r.reminder_sent_at);
  if (eligible.length === 0) {
    return Response.json({ sent: 0, message: 'No reminders due' });
  }

  let sent = 0;
  const errors = [];
  const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
  for (const reservation of eligible) {
    const isPending = reservation.status === 'Pending';
    const dateObj = new Date(tomorrowStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });

    if (isPending) {
      // Nudge unconfirmed guests to confirm
      const rsvpUrl = `${origin}/reserve/${reservation.confirm_token}`;
      const body = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <h1 style="color:#c89b4f;font-size:22px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
    <p style="color:#888;font-size:12px;margin:8px 0 0;">Confirm Your Reservation</p>
  </div>
  <div style="padding:36px 32px;background:#faf9f7;">
    <h2 style="font-size:20px;margin:0 0 8px;">Don't forget to confirm, ${reservation.guest_name}!</h2>
    <p style="color:#666;font-size:14px;margin:0 0 28px;">You have a pending reservation at JTAP Kitchen for tomorrow. Please confirm so we can hold your table.</p>
    <div style="background:#fff;border:1px solid #e8e0d4;border-radius:12px;padding:24px;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;width:120px;">Date</td><td style="padding:8px 0;font-weight:600;">${formattedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Time</td><td style="padding:8px 0;font-weight:600;">${reservation.time}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Party size</td><td style="padding:8px 0;font-weight:600;">${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${rsvpUrl}" style="display:inline-block;background:#C89B4F;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;">Confirm Your Reservation &rarr;</a>
    </div>
    <p style="margin:0;font-size:13px;color:#888;">Can't make it? You can cancel through the link above. Call us at <strong>901-233-4060</strong> if you have questions.</p>
  </div>
  <div style="padding:20px 32px;background:#1a1a1a;text-align:center;">
    <p style="color:#555;font-size:12px;margin:0;">JTAP Kitchen · Memphis, TN</p>
  </div>
</body></html>`;
      try {
        await sendTransactionalEmail(base44, {
          to: reservation.email,
          from_name: 'JTAP Kitchen',
          subject: `Action needed: Confirm your reservation tomorrow at ${reservation.time}`,
          body,
        });
        await base44.asServiceRole.entities.Reservation.update(reservation.id, {
          reminder_sent_at: new Date().toISOString(),
        });
        if (reservation.sms_opt_in && reservation.phone) {
          const firstName = (reservation.guest_name || '').split(' ')[0] || 'there';
          try {
            await sendReminderSms(reservation.phone, `JTAP Kitchen: Hi ${firstName}, don't forget to confirm your reservation for tomorrow, ${formattedDate} at ${reservation.time}. Check your email for the link. Call 901-233-4060. Reply STOP to opt out.`);
          } catch (smsErr) {
            errors.push({ id: reservation.id, error: 'SMS: ' + smsErr.message });
          }
        }
        sent++;
      } catch (err) {
        errors.push({ id: reservation.id, error: err.message });
      }
      continue;
    }

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
            <tr><td style="padding:8px 0;color:#888;">Time</td><td style="padding:8px 0;font-weight:600;">${reservation.time}</td></tr>
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

    try {
      await sendTransactionalEmail(base44, {
        to: reservation.email,
        from_name: 'JTAP Kitchen',
        subject: `Reminder: Your reservation tomorrow at ${reservation.time}`,
        body,
      });
      await base44.asServiceRole.entities.Reservation.update(reservation.id, {
        reminder_sent_at: new Date().toISOString(),
      });
      if (reservation.sms_opt_in && reservation.phone) {
        const firstName = (reservation.guest_name || '').split(' ')[0] || 'there';
        try {
          await sendReminderSms(reservation.phone, `JTAP Kitchen: Reminder: your reservation tomorrow, ${formattedDate} at ${reservation.time}, party of ${reservation.party_size}. We'll see you then! Call 901-233-4060 with questions. Reply STOP to opt out.`);
        } catch (smsErr) {
          errors.push({ id: reservation.id, error: 'SMS: ' + smsErr.message });
        }
      }
      sent++;
    } catch (err) {
      errors.push({ id: reservation.id, error: err.message });
    }
  }

  if (errors.length > 0) {
    await notifyAdmins(base44, {
      subject: `Reservation reminders: ${errors.length} failed (sent ${sent}/${eligible.length})`,
      body: `The daily reservation reminder job for <strong>${tomorrowStr}</strong> hit ${errors.length} error(s).<br><br>Sent: ${sent} / ${eligible.length}<br><br><strong>Failed reservations:</strong><br>${errors.map((e) => `${e.id} — ${e.error}`).join('<br>')}`,
    }).catch(() => {});
  }
  return Response.json({ sent, total: eligible.length, errors });
});