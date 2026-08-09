import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { application_id } = await req.json();
  if (!application_id) {
    return Response.json({ error: 'application_id required' }, { status: 400 });
  }

  const apps = await base44.asServiceRole.entities.JobApplication.filter({ id: application_id });
  const app = apps[0];
  if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });

  const scheduleUrl = `${req.headers.get('origin') || 'https://jtapkitchen.com'}/schedule-interview?app_id=${application_id}`;

  await sendTransactionalEmail(base44, {
    to: app.email,
    subject: `Interview Invitation — ${app.job_title} at JTAP Kitchen`,
    body: `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
    </div>
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 22px; margin: 0 0 12px;">Hi ${app.applicant_name},</h2>
      <p style="color: #555; line-height: 1.7; margin: 0 0 20px;">
        We're excited about your application for the <strong>${app.job_title}</strong> position and would love to connect with you for an interview.
      </p>
      <p style="color: #555; line-height: 1.7; margin: 0 0 32px;">
        Please click the button below to view available time slots and pick one that works best for you. The booking only takes a moment.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${scheduleUrl}" style="display: inline-block; background: #C89B4F; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-family: Inter, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
          Choose Your Interview Slot →
        </a>
      </div>
      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
        If you have any questions, reply to this email or reach us at <a href="mailto:careers@jtapkitchen.com" style="color: #C89B4F;">careers@jtapkitchen.com</a>.
      </p>
    </div>
    <div style="background: #f5f3f0; padding: 20px 36px; text-align: center;">
      <p style="color: #aaa; font-size: 12px; font-family: Inter, sans-serif; margin: 0;">© JTAP Kitchen · Memphis, TN</p>
    </div>
  </div>
</body>
</html>`,
  });

  // Mark invite as sent & move status
  await base44.asServiceRole.entities.JobApplication.update(application_id, {
    status: 'Under Review',
    interview_invite_sent: true,
  });

  return Response.json({ success: true });
});