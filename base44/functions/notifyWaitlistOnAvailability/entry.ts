import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { secrets } from 'base44:runtime';
import { sendSms } from '../../shared/sendSms.js';

// System-triggered by the "Waitlist Notify on Cancellation" workflow when a
// Reservation is cancelled. No user session is available, so entity access and
// email dispatch use the service role.
//
// When a SAME-DAY reservation cancels, the freed table is offered to the next
// waiting walk-in party (FIFO) whose size fits the table. That party is emailed
// and moved to "Table Ready".

function todayInChicago() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { reservation_id } = body;
    if (!reservation_id) {
      return Response.json({ error: 'reservation_id is required' }, { status: 400 });
    }

    let reservation;
    try {
      reservation = await base44.asServiceRole.entities.Reservation.get(reservation_id);
    } catch (_) {
      reservation = null;
    }
    if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });
    if (reservation.status !== 'Cancelled') return Response.json({ skipped: 'Reservation not cancelled' });

    const today = todayInChicago();
    if (reservation.date !== today) {
      return Response.json({ skipped: 'Not a same-day cancellation', reservation_date: reservation.date, today });
    }

    const waiting = await base44.asServiceRole.entities.Waitlist.filter({ status: 'Waiting' });
    // FIFO — earliest added first.
    const sorted = waiting
      .filter((w) => w.added_at)
      .sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime());

    const freedSeats = Number(reservation.party_size) || 0;
    // Seat the first waiting party that fits the freed table.
    const match = sorted.find(
      (w) => Number(w.party_size) > 0 && Number(w.party_size) <= freedSeats
    );

    if (!match) {
      return Response.json({ notified: 0, message: 'No waiting party fits the freed table' });
    }

    const partySize = Number(match.party_size) || 1;
    await sendTransactionalEmail(base44, {
      to: match.email,
      subject: 'Your Table at JTAP Kitchen is Ready!',
      body: `Hello ${match.guest_name},\n\nGreat news! A table has just opened up at JTAP Kitchen and you're next in line.\n\nPlease check in with the host within 10 minutes to claim your table for your party of ${partySize}.\n\nWe can't wait to host you!\n\n— The JTAP Kitchen Team`,
    });

    // Text the waiting guest if they left a number — table-ready alerts are the
    // reason the number was collected, so presence implies consent. Non-blocking
    // so a Twilio failure can't keep the waitlist record from being marked ready.
    if (match.phone) {
      const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
      const authToken = secrets.get('TWILIO_AUTH_TOKEN');
      const fromNumber = secrets.get('TWILIO_FROM_NUMBER');
      if (accountSid && authToken && fromNumber) {
        const firstName = (match.guest_name || '').split(' ')[0] || 'there';
        try {
          await sendSms({
            to: match.phone,
            body: `JTAP Kitchen: Hi ${firstName}, a table just opened up for your party of ${partySize}! Please check in with the host within 10 minutes. See you soon! 901-233-4060. Reply STOP to opt out.`,
            accountSid, authToken, fromNumber,
          });
        } catch (smsErr) {
          console.error('Waitlist table-ready SMS failed:', smsErr.message);
        }
      }
    }

    await base44.asServiceRole.entities.Waitlist.update(match.id, {
      status: 'Table Ready',
      notification_sent: true,
      notified_at: new Date().toISOString(),
    });

    return Response.json({ notified: 1, guest: match.guest_name, party_size: partySize });
  } catch (error) {
    console.error('notifyWaitlistOnAvailability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});