import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';
import { secrets } from 'base44:runtime';

// Only accept submissions that originate from this app's own domain.
// The function's public URL can be called by anyone, so we require a
// browser Origin (or Referer) whose host matches the request's own Host
// — i.e. a same-origin call from the site — before dispatching email.
// Direct hits to the raw function URL carry no Origin and are rejected.
function isAllowedOrigin(req) {
  const origin = (req.headers.get('origin') || '').toLowerCase();
  const referer = (req.headers.get('referer') || '').toLowerCase();
  const host = (req.headers.get('host') || '').toLowerCase();
  if (!host) return false;
  const fromHeader = (url) => {
    if (!url) return false;
    try {
      return new URL(url).host.toLowerCase() === host;
    } catch { return false; }
  };
  // Same-origin browser request (primary path for the SDK).
  if (fromHeader(origin) || fromHeader(referer)) return true;
  // Fallback: an explicit app URL configured via secrets.
  const appUrl = (secrets.get('APP_URL') || '').toLowerCase().replace(/\/$/, '');
  if (appUrl && (origin === appUrl || origin.startsWith(appUrl + '/') || referer === appUrl || referer.startsWith(appUrl + '/'))) return true;
  return false;
}

export default async function(req) {
  let base44;
  try {
    if (!isAllowedOrigin(req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    base44 = createClientFromRequest(req);
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rl = await enforceRateLimit(req, base44, 'contact-form', String(email).toLowerCase(), 3, 3600000);
    if (rl) return rl;

    const escapeHtml = (text) => String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await sendTransactionalEmail(base44, {
      to: 'info@jtapkitchen.com',
      subject: `New Contact Form: ${subject || 'General Inquiry'}`,
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #C89B4F;">New Contact Form Submission</h2>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; width: 80px;">Name:</td><td style="padding: 8px 0;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Email:</td><td style="padding: 8px 0;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Phone:</td><td style="padding: 8px 0;">${escapeHtml(phone || 'Not provided')}</td></tr>
          <tr><td style="padding: 8px 0; color: #888;">Subject:</td><td style="padding: 8px 0;">${escapeHtml(subject || 'General Inquiry')}</td></tr>
        </table>
        <h3 style="margin-top: 20px; font-size: 14px; color: #888; text-transform: uppercase;">Message</h3>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
      </div>`,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (base44) {
      await notifyAdmins(base44, {
        subject: 'Contact form notification failed',
        body: `The sendContactFormNotification function threw an error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}