import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function firstName(name) {
  return esc((String(name || 'there').trim().split(/\s+/)[0]) || 'there');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Triggered by the "New Tap Room Member Welcome Email" workflow whenever a
// TapRoomMember record is created. Sends a branded welcome email with the
// member's loyalty details. No user session is available (system-triggered),
// so entity access uses the service role.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { member_id } = await req.json().catch(() => ({}));
    if (!member_id) {
      return Response.json({ error: 'member_id required' }, { status: 400 });
    }

    const member = await base44.asServiceRole.entities.TapRoomMember.get(member_id);
    if (!member) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }
    if (!member.email) {
      return Response.json({ skipped: true, reason: 'no email on file' });
    }

    await sendTransactionalEmail(base44, {
      to: member.email,
      subject: 'Welcome to The JTAP Room Society — JTAP Kitchen',
      body: buildWelcomeEmail(member),
    });

    return Response.json({ success: true, sent_to: member.email });
  } catch (error) {
    console.error('sendTapRoomWelcomeEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildWelcomeEmail(m) {
  const first = firstName(m.guest_name);
  const joinedStr = formatDate(m.joined_date);
  const credit = Number(m.welcome_credit_issued || 0);

  const rows = [
    `<tr><td style="padding:8px 0;color:#888;width:130px;">Membership Tier:</td><td style="padding:8px 0;"><strong>${esc(m.tier || 'Regular')}</strong></td></tr>`,
    joinedStr ? `<tr><td style="padding:8px 0;color:#888;">Member Since:</td><td style="padding:8px 0;">${joinedStr}</td></tr>` : '',
    `<tr><td style="padding:8px 0;color:#888;">Points Balance:</td><td style="padding:8px 0;">${Number(m.points_balance || 0)} pts</td></tr>`,
    credit > 0 ? `<tr><td style="padding:8px 0;color:#888;">Welcome Credit:</td><td style="padding:8px 0;"><strong style="color:#1a6b3a;">$${credit.toFixed(0)} to spend</strong></td></tr>` : '',
    m.private_room_access ? `<tr><td style="padding:8px 0;color:#888;">Private Room Access:</td><td style="padding:8px 0;">Unlocked</td></tr>` : '',
    Number(m.free_rentals_remaining || 0) > 0 ? `<tr><td style="padding:8px 0;color:#888;">Free Rentals:</td><td style="padding:8px 0;">${Number(m.free_rentals_remaining)} included</td></tr>` : '',
  ].filter(Boolean).join('');

  const referralBlock = m.referral_code ? `
    <div style="background:#fffbf0;border:2px dashed #C89B4F;border-radius:12px;padding:18px;text-align:center;margin:0 0 24px;">
      <p style="color:#888;font-size:12px;margin:0 0 6px;letter-spacing:1px;text-transform:uppercase;">Your Referral Code</p>
      <p style="color:#C89B4F;font-size:22px;font-weight:700;margin:0 0 6px;letter-spacing:2px;">${esc(m.referral_code)}</p>
      <p style="color:#999;font-size:12px;margin:0;">Share it with friends — when they join, you both earn rewards.</p>
    </div>` : '';

  const referredBy = m.referred_by_name
    ? `<p style="color:#555;line-height:1.7;margin:0 0 20px;">Welcome thanks to <strong>${esc(m.referred_by_name)}</strong> — we're glad you're here.</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Welcome to the Society</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:24px;margin:0 0 12px;">You're In, ${first}.</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Welcome to The JTAP Room Society. Your membership is active — here's everything that comes with it.</p>
      ${referredBy}
      <div style="background:#f5f3f0;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">${rows}</table>
      </div>
      ${referralBlock}
      <div style="background:#f5f3f0;border-radius:12px;padding:18px 20px;margin:0 0 28px;">
        <p style="margin:0 0 6px;font-size:14px;color:#1a1a1a;"><strong>How to earn points:</strong> dine with us — every visit adds to your balance.</p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;"><strong>How to redeem:</strong> mention your membership at checkout.</p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="https://jtapkitchen.com/my-membership" style="display:inline-block;background:#C89B4F;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:50px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.3px;">View Your Membership &rarr;</a>
      </div>
      <p style="color:#999;font-size:13px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-213-8085<br/>
        <a href="https://jtapkitchen.com/my-membership" style="color:#C89B4F;">View your membership</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}