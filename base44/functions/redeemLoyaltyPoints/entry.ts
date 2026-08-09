import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

// Canonical reward catalog — the frontend sends only `rewardPoints`; the
// server resolves the full reward from this list so a client can't redeem a
// non-existent or mis-priced reward.
const REWARDS = [
  { points: 500,  label: 'Free Appetizer',          trigger: 'redemption_food',   value: 0  },
  { points: 1000, label: '$10 Dining Credit',        trigger: 'redemption_food',   value: 10 },
  { points: 1500, label: 'Free Dessert for Two',     trigger: 'redemption_food',   value: 0  },
  { points: 2500, label: '$25 Dining Credit',        trigger: 'redemption_food',   value: 25 },
  { points: 5000, label: 'Complimentary Dinner',     trigger: 'redemption_food',   value: 80 },
  { points: 7500, label: 'Private Room Happy Hour',  trigger: 'redemption_rental', value: 0  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rewardPoints } = await req.json();
    const reward = REWARDS.find((r) => r.points === Number(rewardPoints));
    if (!reward) return Response.json({ error: 'Invalid reward' }, { status: 400 });

    const members = await base44.asServiceRole.entities.TapRoomMember.filter({ email: user.email });
    const member = members[0];
    if (!member) return Response.json({ error: 'Membership not found' }, { status: 404 });

    if ((member.points_balance || 0) < reward.points) {
      return Response.json({ error: 'Not enough points' }, { status: 400 });
    }

    const newBalance = (member.points_balance || 0) - reward.points;
    await base44.asServiceRole.entities.TapRoomMember.update(member.id, {
      points_balance: newBalance,
      total_points_redeemed: (member.total_points_redeemed || 0) + reward.points,
    });

    await base44.asServiceRole.entities.PointsActivity.create({
      member_id: member.id,
      member_name: member.guest_name,
      member_email: member.email,
      transaction_type: 'Redeem',
      points: -reward.points,
      balance_after: newBalance,
      trigger: reward.trigger,
      description: `Redeemed: ${reward.label}`,
      transaction_date: new Date().toISOString().split('T')[0],
    });

    // Confirm with the member + notify staff (best-effort; never block redemption).
    const settings = await base44.asServiceRole.entities.AppSettings.list().then((d) => d[0]);
    try {
      await sendTransactionalEmail(base44, {
        to: member.email,
        subject: `Reward Redeemed: ${reward.label}`,
        body: buildMemberEmail(member, reward, newBalance),
      });
      if (settings && settings.contact_email) {
        await sendTransactionalEmail(base44, {
          to: settings.contact_email,
          subject: `Loyalty Redemption — ${member.guest_name}`,
          body: buildStaffEmail(member, reward, newBalance),
        });
      }
    } catch {
      // email failures shouldn't fail a successful redemption
    }

    return Response.json({ success: true, newBalance, reward });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildMemberEmail(member, reward, newBalance) {
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Reward Redeemed</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${escapeHtml(member.guest_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;">You've redeemed <strong>${escapeHtml(reward.label)}</strong> for <strong>${reward.points.toLocaleString()} points</strong>.</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>New Points Balance:</strong> ${newBalance.toLocaleString()} pts</p>
        <p style="margin:0;font-size:14px;color:#888;">Show this email to your server at your next visit to claim your reward.</p>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com</p>
    </div>
  </div>
</body></html>`;
}

function buildStaffEmail(member, reward, newBalance) {
  return `<!DOCTYPE html>
<html><body style="font-family:Inter,sans-serif;background:#f5f5f5;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e8e0d5;padding:32px;">
    <h2 style="margin:0 0 16px;">Loyalty Redemption</h2>
    <p style="margin:0 0 8px;"><strong>Member:</strong> ${escapeHtml(member.guest_name)} (${escapeHtml(member.email)})</p>
    <p style="margin:0 0 8px;"><strong>Reward:</strong> ${escapeHtml(reward.label)}</p>
    <p style="margin:0 0 8px;"><strong>Points Used:</strong> ${reward.points.toLocaleString()}</p>
    <p style="margin:0 0 16px;"><strong>New Balance:</strong> ${newBalance.toLocaleString()} pts</p>
    <p style="color:#888;font-size:12px;margin:0;">Honor this reward at the member's next visit — verify identity via their membership number/email.</p>
  </div>
</body></html>`;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}