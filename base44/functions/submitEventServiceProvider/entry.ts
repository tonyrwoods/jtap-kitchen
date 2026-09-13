import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

const CATEGORIES = [
  'Wedding Planner', 'Event Planner', 'DJ', 'Musician', 'Photographer',
  'Florist', 'MC / Host', 'Clown / Entertainer', 'Officiant', 'Other'
];
const RATE_UNITS = ['Flat Rate', 'Per Hour', 'Per Guest'];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const email = String(body.contact_email || '').trim().toLowerCase();
    const category = String(body.category || '');
    if (!body.name || !email || !category) {
      return Response.json({ error: 'name, contact_email, and category are required' }, { status: 400 });
    }
    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: 'invalid category' }, { status: 400 });
    }
    const rateUnit = RATE_UNITS.includes(body.rate_unit) ? body.rate_unit : 'Flat Rate';

    // Per-email + per-IP flood guard (3 submissions / 10 min per email).
    const rl = await enforceRateLimit(req, base44, 'event-provider-signup', email, 3, 600000);
    if (rl) return rl;

    const baseRate = parseFloat(body.base_rate);
    // Public submissions are inactive until an admin reviews & activates them.
    const record = {
      name: String(body.name).slice(0, 120),
      category,
      bio: String(body.bio || '').slice(0, 2000),
      photo_url: String(body.photo_url || '').slice(0, 500),
      base_rate: isNaN(baseRate) ? 0 : baseRate,
      rate_unit: rateUnit,
      contact_email: email,
      is_active: false,
      is_featured: false,
    };

    const created = await base44.asServiceRole.entities.EventServiceProvider.create(record);

    await sendTransactionalEmail(base44, {
      to: email,
      subject: 'Application Received — JTAP Kitchen Event Center',
      body: buildEmail(record),
    }).catch(() => {});

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildEmail(r) {
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Application Received</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${esc(r.name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;">Thank you for your interest in joining our network as a <strong>${esc(r.category)}</strong>! We've received your application and our team will review it shortly.</p>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;">Once approved, we'll activate your profile so clients can select you when booking private events at the JTAP Kitchen Event Center.</p>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">— The JTAP Kitchen Events Team<br/>events@jtapkitchen.com</p>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN</p>
    </div>
  </div>
</body></html>`;
}