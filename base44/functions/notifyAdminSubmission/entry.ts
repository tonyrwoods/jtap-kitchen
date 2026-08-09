import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { event, data } = body;
    const entityType = event?.entity_name;
    const d = data || {};

    const escapeHtml = (text) => String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let subject, bodyHtml;

    switch (entityType) {
      case 'EventCenterInquiry':
        subject = `New Event Inquiry: ${d.event_type || 'General'} — ${d.contact_name || 'Unknown'}`;
        bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#C89B4F;">New Event Center Inquiry</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Contact:</td><td style="padding:8px 0;">${escapeHtml(d.contact_name)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email:</td><td style="padding:8px 0;">${escapeHtml(d.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Phone:</td><td style="padding:8px 0;">${escapeHtml(d.phone || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Event Type:</td><td style="padding:8px 0;">${escapeHtml(d.event_type || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Preferred Day:</td><td style="padding:8px 0;">${escapeHtml(d.preferred_day || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Preferred Date:</td><td style="padding:8px 0;">${escapeHtml(d.preferred_date || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Guest Count:</td><td style="padding:8px 0;">${escapeHtml(d.guest_count || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Package:</td><td style="padding:8px 0;">${escapeHtml(d.package || 'N/A')}</td></tr>
          </table>
          ${d.message ? `<h3 style="margin-top:20px;font-size:14px;color:#888;text-transform:uppercase;">Message</h3><div style="background:#f9f9f9;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(d.message)}</div>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#999;">Review in the admin dashboard under Event Center inquiries.</p>
        </div>`;
        break;

      case 'EventServiceProvider':
        subject = `New Vendor Application: ${d.business_name || d.full_name || 'Unknown'}`;
        bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#C89B4F;">New Vendor / Service Provider Application</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Name:</td><td style="padding:8px 0;">${escapeHtml(d.full_name)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Business:</td><td style="padding:8px 0;">${escapeHtml(d.business_name || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email:</td><td style="padding:8px 0;">${escapeHtml(d.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Phone:</td><td style="padding:8px 0;">${escapeHtml(d.phone || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Category:</td><td style="padding:8px 0;">${escapeHtml(d.service_category)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Experience:</td><td style="padding:8px 0;">${escapeHtml(d.experience_years ? d.experience_years + ' years' : 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Availability:</td><td style="padding:8px 0;">${escapeHtml(d.availability || 'N/A')}</td></tr>
            ${d.portfolio_url ? `<tr><td style="padding:8px 0;color:#888;">Portfolio:</td><td style="padding:8px 0;"><a href="${escapeHtml(d.portfolio_url)}">${escapeHtml(d.portfolio_url)}</a></td></tr>` : ''}
            ${d.instagram_handle ? `<tr><td style="padding:8px 0;color:#888;">Instagram:</td><td style="padding:8px 0;">${escapeHtml(d.instagram_handle)}</td></tr>` : ''}
          </table>
          ${d.bio ? `<h3 style="margin-top:20px;font-size:14px;color:#888;text-transform:uppercase;">About</h3><div style="background:#f9f9f9;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(d.bio)}</div>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#999;">Review and approve in the admin dashboard under Vendor Applications.</p>
        </div>`;
        break;

      case 'JobApplication':
        subject = `New Job Application: ${d.applicant_name || 'Unknown'} — ${d.job_title || 'Position'}`;
        bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#C89B4F;">New Job Application</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Applicant:</td><td style="padding:8px 0;">${escapeHtml(d.applicant_name)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email:</td><td style="padding:8px 0;">${escapeHtml(d.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Phone:</td><td style="padding:8px 0;">${escapeHtml(d.phone || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Position:</td><td style="padding:8px 0;">${escapeHtml(d.job_title || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Experience:</td><td style="padding:8px 0;">${escapeHtml(d.experience_years ? d.experience_years + ' years' : 'N/A')}</td></tr>
            ${d.resume_url ? `<tr><td style="padding:8px 0;color:#888;">Resume:</td><td style="padding:8px 0;"><a href="${escapeHtml(d.resume_url)}">View Resume</a></td></tr>` : ''}
          </table>
          ${d.cover_letter ? `<h3 style="margin-top:20px;font-size:14px;color:#888;text-transform:uppercase;">Cover Letter</h3><div style="background:#f9f9f9;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(d.cover_letter)}</div>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#999;">Review in the admin dashboard under Careers → Applications.</p>
        </div>`;
        break;

      case 'Review':
        subject = `New Review Pending Approval: ${d.rating || '?'}★ from ${d.guest_name || 'Guest'}`;
        bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#C89B4F;">New Review Submitted</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Guest:</td><td style="padding:8px 0;">${escapeHtml(d.guest_name)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email:</td><td style="padding:8px 0;">${escapeHtml(d.email || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Rating:</td><td style="padding:8px 0;">${'★'.repeat(Math.max(1, Math.min(5, d.rating || 0)))} (${d.rating || 0}/5)</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Visit Date:</td><td style="padding:8px 0;">${escapeHtml(d.visit_date || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Status:</td><td style="padding:8px 0;">${escapeHtml(d.status || 'Pending')}</td></tr>
          </table>
          <h3 style="margin-top:20px;font-size:14px;color:#888;text-transform:uppercase;">Review</h3>
          <div style="background:#f9f9f9;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(d.comment)}</div>
          <p style="margin-top:24px;font-size:13px;color:#999;">Approve or reject in the admin dashboard under Reviews.</p>
        </div>`;
        break;

      case 'PrivateRoomRental':
        subject = `New Private Room Request: ${d.event_type || 'Booking'} — ${d.member_name || 'Unknown'}`;
        bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#C89B4F;">New Private Room Booking Request</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Member:</td><td style="padding:8px 0;">${escapeHtml(d.member_name)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email:</td><td style="padding:8px 0;">${escapeHtml(d.member_email)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Tier:</td><td style="padding:8px 0;">${escapeHtml(d.member_tier || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Event Type:</td><td style="padding:8px 0;">${escapeHtml(d.event_type || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Date:</td><td style="padding:8px 0;">${escapeHtml(d.event_date || 'N/A')} (${escapeHtml(d.day_of_week || '')})</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Time:</td><td style="padding:8px 0;">${escapeHtml(d.start_time || '')} – ${escapeHtml(d.end_time || '')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Guests:</td><td style="padding:8px 0;">${escapeHtml(d.guest_count || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Rental Rate:</td><td style="padding:8px 0;">${d.is_free_rental ? 'FREE (complimentary)' : '$' + (d.rental_rate || 0)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Deposit:</td><td style="padding:8px 0;">$${escapeHtml(d.deposit_amount || 0)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">F&amp;B Min:</td><td style="padding:8px 0;">$${escapeHtml(d.min_fb_spend || 0)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">AV Needed:</td><td style="padding:8px 0;">${d.av_needed ? 'Yes' : 'No'}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Floral/Decor:</td><td style="padding:8px 0;">${d.floral_needed ? 'Yes' : 'No'}</td></tr>
          </table>
          ${d.special_requests ? `<h3 style="margin-top:20px;font-size:14px;color:#888;text-transform:uppercase;">Special Requests</h3><div style="background:#f9f9f9;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(d.special_requests)}</div>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#999;">Review and confirm in the admin dashboard under Private Room Rentals.</p>
        </div>`;
        break;

      default:
        return Response.json({ skipped: true, reason: `No handler for ${entityType}` });
    }

    await sendTransactionalEmail(base44, {
      to: 'info@jtapkitchen.com',
      subject,
      body: bodyHtml,
      from_name: 'JTAP Kitchen',
    });

    return Response.json({ success: true, entityType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}