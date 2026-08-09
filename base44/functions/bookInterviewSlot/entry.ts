import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Atomic-ish interview slot booking: verifies the slot is still open before
// claiming it (prevents the double-book race the old client-side flow had),
// updates the application, and sends a resilient confirmation email.
export default async function (req) {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const { application_id, slot_id } = await req.json();
    if (!application_id || !slot_id) {
      return Response.json({ error: 'application_id and slot_id are required' }, { status: 400 });
    }

    const apps = await base44.asServiceRole.entities.JobApplication.filter({ id: application_id });
    const application = apps[0];
    if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });

    const slots = await base44.asServiceRole.entities.InterviewSlot.filter({ id: slot_id });
    const slot = slots[0];
    if (!slot) return Response.json({ error: 'Slot not found' }, { status: 404 });
    if (slot.is_booked) {
      return Response.json({ error: 'That time slot has already been booked. Please choose another.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.InterviewSlot.update(slot.id, {
      is_booked: true,
      booked_by_application_id: application_id,
      booked_by_name: application.applicant_name,
    });
    await base44.asServiceRole.entities.JobApplication.update(application_id, {
      status: 'Interview Scheduled',
      interview_slot_id: slot.id,
      interview_date: slot.date,
      interview_time: slot.start_time,
      interview_invite_sent: true,
    });

    if (application.email) {
      await sendTransactionalEmail(base44, {
        to: application.email,
        subject: 'Interview Confirmed — JTAP Kitchen',
        body: buildEmail(application, slot),
      }).catch(async (err) => {
        await notifyAdmins(base44, {
          subject: 'Interview confirmation email failed',
          body: `An interview was booked but the confirmation email could not be sent to the candidate.<br><br><strong>Candidate:</strong> ${application.applicant_name} &lt;${application.email}&gt;<br><strong>Role:</strong> ${application.job_title || '(unknown)'}<br><strong>Slot:</strong> ${slot.date} ${slot.start_time}<br><strong>Error:</strong> ${err?.message || err}`,
        }).catch(() => {});
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (base44) {
      await notifyAdmins(base44, {
        subject: 'Interview booking failed',
        body: `The bookInterviewSlot function threw an error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildEmail(application, slot) {
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Interview Confirmed</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${esc(application.applicant_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Your interview for <strong>${esc(application.job_title)}</strong> has been confirmed!</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${fmtDate(slot.date)}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${esc(slot.start_time)} – ${esc(slot.end_time)}</p>
        <p style="margin:0;font-size:14px;"><strong>Location:</strong> ${esc(slot.location || 'JTAP Kitchen – In Person')}</p>
      </div>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">We look forward to meeting you!</p>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com</p>
    </div>
  </div>
</body></html>`;
}