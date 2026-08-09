import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

// Recipient for the kitchen prep report. Change here to route elsewhere.
const KITCHEN_EMAIL = 'info@jtapkitchen.com';

export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  try {

  // Today's date in the restaurant's timezone (Memphis = America/Chicago),
  // formatted YYYY-MM-DD to match how EventPromotion.date is stored.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

  const promotions = await base44.asServiceRole.entities.EventPromotion.filter({ is_active: true });
  const todays = promotions.filter((p) => p.date === today);
  if (todays.length === 0) {
    return Response.json({ success: true, message: 'No events scheduled today', sent: 0 });
  }

  let sent = 0;
  const errors = [];
  for (const promo of todays) {
    try {
      const invites = await base44.asServiceRole.entities.EventInvite.filter({ promotion_id: promo.id });
      const attending = invites.filter((i) => i.rsvp_status === 'Attending');
      const withNotes = attending.filter((i) => (i.dietary_notes || '').trim());

      await sendTransactionalEmail(base44, {
        to: KITCHEN_EMAIL,
        subject: `Kitchen Prep — ${promo.title} (${today})`,
        body: buildReport(promo, attending, withNotes, today),
      });
      sent += 1;
    } catch (e) {
      errors.push({ promotion_id: promo.id, error: e.message });
    }
  }

  if (errors.length > 0) {
    await notifyAdmins(base44, {
      subject: `Kitchen dietary report: ${errors.length} failed`,
      body: `The daily kitchen dietary prep report for <strong>${today}</strong> hit ${errors.length} error(s).<br><br>Sent: ${sent}<br><br><strong>Failed:</strong><br>${errors.map((e) => `${e.promotion_id} — ${e.error}`).join('<br>')}`,
    }).catch(() => {});
  }
  return Response.json({ success: true, sent, errors });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Kitchen dietary report job crashed',
      body: `The daily kitchen dietary prep report threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
};

function formatTime(time) {
  if (!time) return '';
  const parts = time.split(':');
  const hour = parseInt(parts[0]);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${minute} ${ampm}`;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildReport(promo, attending, withNotes, today) {
  const dateStr = promo.date
    ? new Date(promo.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : today;
  const timeStr = formatTime(promo.time);

  const noteRows = withNotes
    .map((i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:600;">${escapeHtml(i.guest_name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;">${i.party_size || 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(i.dietary_notes)}</td>
      </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:28px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:24px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Kitchen Dietary Prep Report</p>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;margin:0 0 6px;">${escapeHtml(promo.title)}</h2>
      <p style="color:#888;font-size:13px;margin:0 0 20px;">
        ${dateStr}${timeStr ? ` &middot; ${timeStr}${promo.end_time ? '–' + formatTime(promo.end_time) : ''}` : ''}
        ${promo.location_label ? ` &middot; ${escapeHtml(promo.location_label)}` : ''}
      </p>

      <div style="display:flex;gap:12px;margin:0 0 24px;">
        <div style="flex:1;background:#f5f3f0;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:26px;font-weight:bold;margin:0;color:#1a1a1a;">${attending.length}</p>
          <p style="font-size:12px;color:#888;margin:4px 0 0;">Total Attending</p>
        </div>
        <div style="flex:1;background:#fffbf0;border-left:4px solid #C89B4F;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:26px;font-weight:bold;margin:0;color:#C89B4F;">${withNotes.length}</p>
          <p style="font-size:12px;color:#888;margin:4px 0 0;">Special Dietary Notes</p>
        </div>
      </div>

      ${withNotes.length > 0
        ? `<p style="font-size:14px;color:#555;margin:0 0 12px;font-weight:600;">Guests requiring special preparation:</p>
           <table style="width:100%;font-size:13px;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
             <thead><tr style="background:#f5f3f0;">
               <th style="padding:10px 12px;text-align:left;color:#666;font-weight:600;">Guest</th>
               <th style="padding:10px 12px;text-align:left;color:#666;font-weight:600;">Party</th>
               <th style="padding:10px 12px;text-align:left;color:#666;font-weight:600;">Dietary Notes</th>
             </tr></thead>
             <tbody>${noteRows}</tbody>
           </table>`
        : `<div style="background:#f5f3f0;border-radius:12px;padding:20px;text-align:center;">
             <p style="margin:0;font-size:14px;color:#666;">No special dietary requests for this event.</p>
           </div>`
      }

      <p style="color:#999;font-size:12px;line-height:1.6;margin:24px 0 0;border-top:1px solid #eee;padding-top:16px;">
        Auto-generated by JTAP Kitchen event system &middot; ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
      </p>
    </div>
  </div>
</body></html>`;
}