import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const escapeHtml = (text) => String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await sendEmailViaGmail(base44, {
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}