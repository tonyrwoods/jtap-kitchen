import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { contact_name, email, event_type, preferred_day, preferred_date, guest_count } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    await sendEmailViaGmail(base44, {
      to: email,
      subject: 'Event Inquiry Received — JTAP Kitchen Event Center',
      body: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; padding: 20px;">
        <h2 style="color: #C89B4F; margin-bottom: 16px;">Thank you for your interest, ${contact_name || 'there'}!</h2>
        <p style="line-height: 1.7; color: #555;">We've received your inquiry for a <strong>${event_type || 'private event'}</strong> on <strong>${preferred_day}${preferred_date ? ` (${preferred_date})` : ''}</strong> for approximately <strong>${guest_count} guests</strong>.</p>
        <p style="line-height: 1.7; color: #555;">Our events team will be in touch within 24 hours to discuss availability and personalize your experience.</p>
        <p style="color: #999; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">— The JTAP Kitchen Events Team<br/>info@jtapkitchen.com | 901-554-4431</p>
      </div>`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}