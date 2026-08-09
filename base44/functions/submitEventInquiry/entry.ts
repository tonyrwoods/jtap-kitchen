import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

const escapeHtml = (text) => String(text == null ? '' : text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      contact_name, email, phone, event_type,
      preferred_day, preferred_date, guest_count, package: pkg, message,
    } = body;

    if (!contact_name || !email || !guest_count) {
      return Response.json({ error: 'Name, email, and guest count are required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'submitEventInquiry', String(email).toLowerCase(), 3, 3600000);
    if (limited) return limited;

    // Force server-controlled fields — public submitters cannot self-set status.
    const inquiry = await base44.asServiceRole.entities.EventCenterInquiry.create({
      contact_name,
      email,
      phone: phone || null,
      event_type: event_type || null,
      preferred_day: preferred_day || 'Flexible',
      preferred_date: preferred_date || null,
      guest_count: parseInt(guest_count) || 0,
      package: pkg || 'Not Sure',
      message: message || null,
      status: 'New',
    });

    // Confirmation email to the submitter (external recipient → Gmail).
    const safeName = escapeHtml(contact_name || 'there');
    const safeType = escapeHtml(event_type || 'private event');
    const safeDay = escapeHtml(preferred_day || '');
    const safeDate = preferred_date ? ` (${escapeHtml(preferred_date)})` : '';
    const safeGuests = escapeHtml(guest_count != null ? guest_count : '');
    try {
      await sendTransactionalEmail(base44, {
        to: email,
        subject: 'Event Inquiry Received — JTAP Kitchen Event Center',
        body: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; padding: 20px;">
          <h2 style="color: #C89B4F; margin-bottom: 16px;">Thank you for your interest, ${safeName}!</h2>
          <p style="line-height: 1.7; color: #555;">We've received your inquiry for a <strong>${safeType}</strong> on <strong>${safeDay}${safeDate}</strong> for approximately <strong>${safeGuests} guests</strong>.</p>
          <p style="line-height: 1.7; color: #555;">Our events team will be in touch within 24 hours to discuss availability and personalize your experience.</p>
          <p style="color: #999; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">— The JTAP Kitchen Events Team<br/>info@jtapkitchen.com | 901-554-4431</p>
        </div>`,
      });
    } catch (_) { /* confirmation is best-effort */ }

    return Response.json({ success: true, inquiry });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}