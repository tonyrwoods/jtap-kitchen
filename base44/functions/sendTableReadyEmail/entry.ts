import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { secrets } from 'base44:runtime';
import { sendSms } from '../../shared/sendSms.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'staff') {
      return Response.json({ error: 'Forbidden: Staff or admin access required' }, { status: 403 });
    }

    const { waitlistId, guestName, guestEmail, guestPhone } = await req.json();

    if (!waitlistId || !guestEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send email notification
    const emailResponse = await sendTransactionalEmail(base44, {
      to: guestEmail,
      subject: `${guestName}, Your Table is Ready!`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Table is Ready</h2>
          <p>Hi ${guestName},</p>
          <p>Great news! Your table at <strong>JTAP Kitchen</strong> is ready for you.</p>
          <p style="font-size: 16px; color: #C89B4F;"><strong>Please proceed to the host stand.</strong></p>
          <p>We look forward to serving you!</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">JTAP Kitchen | Memphis, TN | 901-233-4060</p>
        </div>
      `
    });

    // Mark notification as sent
    await base44.entities.Waitlist.update(waitlistId, { notification_sent: true });

    // Optional SMS — staff-ordered table-ready text to a waitlist guest who left
    // a number. Presence implies consent (they gave it to be notified). Non-blocking.
    if (guestPhone) {
      const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
      const authToken = secrets.get('TWILIO_AUTH_TOKEN');
      const fromNumber = secrets.get('TWILIO_FROM_NUMBER');
      if (accountSid && authToken && fromNumber) {
        const firstName = (guestName || '').split(' ')[0] || 'there';
        try {
          await sendSms({
            to: guestPhone,
            body: `JTAP Kitchen: Hi ${firstName}, your table is ready! Please check in with the host within 10 minutes. See you soon! Questions? 901-233-4060. Reply STOP to opt out.`,
            accountSid, authToken, fromNumber,
          });
        } catch (smsErr) {
          console.error('Table-ready SMS failed:', smsErr.message);
        }
      }
    }

    return Response.json({ success: true, message: 'Email sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});