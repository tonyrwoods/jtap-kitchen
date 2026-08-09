import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

// Scheduled job: for events that occurred in the last week, email each
// attending guest a review request. Guarded by `review_request_sent` on the
// promotion so each event is processed exactly once. The one-week window
// prevents a backlog blast on first run.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const promos = await base44.asServiceRole.entities.EventPromotion.list('-created_date', 200);
    const toProcess = promos.filter((p) =>
      p.date && p.date < today && p.date >= weekAgo && !p.review_request_sent
    );

    const appUrl = process.env.APP_URL || 'https://jtapkitchen.com';

    let emailsSent = 0;
    let eventsProcessed = 0;

    for (const promo of toProcess) {
      const invites = await base44.asServiceRole.entities.EventInvite.filter({ promotion_id: promo.id });
      const attending = invites.filter((i) => i.rsvp_status === 'Attending' && i.guest_email);

      for (const inv of attending) {
        const reviewUrl = `${appUrl}/submit-review`;
        try {
          await sendEmailViaGmail(base44, {
            to: inv.guest_email,
            subject: `How was ${promo.title}? We'd love your review`,
            body: buildReviewEmail(promo, inv, reviewUrl),
          });
          emailsSent++;
        } catch {
          // skip individual failures
        }
      }

      await base44.asServiceRole.entities.EventPromotion.update(promo.id, { review_request_sent: true });
      eventsProcessed++;
    }

    return Response.json({ success: true, eventsProcessed, emailsSent });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Event review request job crashed',
      body: `The post-event review request job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildReviewEmail(promo, invite, reviewUrl) {
  const dateStr = promo.date
    ? new Date(promo.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">We'd Love Your Feedback</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${escapeHtml(invite.guest_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;">Thanks for joining us for <strong>${escapeHtml(promo.title)}</strong> on ${dateStr}. We hope you had a wonderful time!</p>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Your review helps us grow and helps future guests discover JTAP Kitchen. It only takes a minute.</p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${reviewUrl}" style="display:inline-block;background:#C89B4F;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;">Leave a Review &rarr;</a>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com</p>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}