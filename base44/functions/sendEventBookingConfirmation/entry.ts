import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

const escapeHtml = (text) => String(text == null ? '' : text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Sends a "Your Event Center booking is confirmed" email to the inquiring
// guest when an admin locks the booking. Admin-only; the recipient and event
// details are fetched server-side from the inquiry record (the client passes
// only the inquiry_id) so a caller can't redirect the email to an arbitrary
// address.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { inquiry_id } = await req.json().catch(() => ({}));
    if (!inquiry_id) {
      return Response.json({ error: 'inquiry_id is required' }, { status: 400 });
    }

    const inquiry = await base44.asServiceRole.entities.EventCenterInquiry.get(inquiry_id);
    if (!inquiry || !inquiry.email) {
      return Response.json({ error: 'Inquiry has no guest email on file' }, { status: 400 });
    }

    const safeName = escapeHtml(inquiry.contact_name || 'there');
    const safeType = escapeHtml(inquiry.event_type || 'private event');
    const dateLabel = inquiry.event_date || inquiry.preferred_date || '';
    const safeDate = dateLabel ? escapeHtml(dateLabel) : '';
    const safeGuests = escapeHtml(inquiry.guest_count != null ? inquiry.guest_count : '');
    const safePackage = inquiry.package && inquiry.package !== 'Not Sure' ? escapeHtml(inquiry.package) : '';

    const dateLine = safeDate
      ? `<strong>${safeDate}</strong>${safePackage ? ` &middot; ${safePackage}` : ''}`
      : safePackage || 'a date our team will confirm with you shortly';

    await sendTransactionalEmail(base44, {
      to: inquiry.email,
      subject: 'Your Event Center Booking is Confirmed — JTAP Kitchen',
      body: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; padding: 20px;">
        <h2 style="color: #C89B4F; margin-bottom: 16px;">Your booking is confirmed, ${safeName}!</h2>
        <p style="line-height: 1.7; color: #555;">We're thrilled to host your <strong>${safeType}</strong> on ${dateLine}${safeGuests ? ` for approximately <strong>${safeGuests} guests</strong>` : ''}.</p>
        <p style="line-height: 1.7; color: #555;">Our events team will reach out shortly to finalize the menu, talent, and any add-ons. If you have questions in the meantime, just reply to this email.</p>
        <p style="color: #999; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">— The JTAP Kitchen Events Team<br/>info@jtapkitchen.com | 901-554-4431</p>
      </div>`,
    });

    // Notify each selected talent provider that they've been booked. Best-effort:
    // the guest confirmation already succeeded, so a talent email failure must
    // not fail the whole call — we collect a per-provider result instead.
    const talentIds = Array.isArray(inquiry.selected_talent_ids) ? inquiry.selected_talent_ids : [];
    const talentResults = [];
    for (const tid of talentIds) {
      if (!tid) continue;
      try {
        const provider = await base44.asServiceRole.entities.EventServiceProvider.get(tid);
        if (!provider || !provider.contact_email) {
          talentResults.push({ id: tid, sent: false, reason: 'no contact email' });
          continue;
        }
        const pName = escapeHtml(provider.name || 'there');
        await sendTransactionalEmail(base44, {
          to: provider.contact_email,
          subject: `You're Booked — JTAP Kitchen Event on ${dateLabel || 'TBD'}`,
          body: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; padding: 20px;">
            <h2 style="color: #C89B4F; margin-bottom: 16px;">Hi ${pName}, you're booked!</h2>
            <p style="line-height: 1.7; color: #555;">You've been selected for a <strong>${safeType}</strong> at JTAP Kitchen${safeDate ? ` on <strong>${safeDate}</strong>` : ''}${safeGuests ? ` for approximately <strong>${safeGuests} guests</strong>` : ''}.</p>
            <p style="line-height: 1.7; color: #555;">Our events team will follow up with timing, setup details, and your rate. Please hold the date and reply to this email if you have any conflicts.</p>
            <p style="color: #999; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">— The JTAP Kitchen Events Team<br/>info@jtapkitchen.com | 901-554-4431</p>
          </div>`,
        });
        talentResults.push({ id: tid, sent: true });
      } catch (e) {
        console.warn(`Talent notify failed for ${tid}:`, e.message);
        talentResults.push({ id: tid, sent: false, reason: e.message });
      }
    }

    return Response.json({ success: true, talent_notified: talentResults.filter(r => r.sent).length, talent_results: talentResults });
  } catch (error) {
    console.error('sendEventBookingConfirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}