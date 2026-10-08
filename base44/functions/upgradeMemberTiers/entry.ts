import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { notifyAdmins } from '../../shared/notifyAdmins.js';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { esc } from '../../shared/escapeHtml.js';

// Scheduled job: promotes active Tap Room Society members to a higher tier
// when their lifetime spend / visits cross an active LoyaltyTier's thresholds.
// Tiers rank by the member tier enum (Regular < Tap Member < Reserve Member <
// Founding Member); only LoyaltyTier records whose name matches that enum are
// eligible, so a misnamed tier can never write an invalid value. Members are
// only ever promoted upward, never downgraded. Mirrors awardReferralBonuses
// (admin-gated scheduled job, service-role data access).

const TIER_RANK = { 'Regular': 0, 'Tap Member': 1, 'Reserve Member': 2, 'Founding Member': 3 };

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Read AppSettings for tier-upgrade controls.
    const settingsList = await base44.asServiceRole.entities.AppSettings.list(null, 5);
    const settings = settingsList[0] || {};
    const tierUpgradeEnabled = settings.tier_upgrade_enabled !== false;
    const minDaysAsMember = Number(settings.tier_upgrade_min_days_as_member) || 0;
    const notifyMembers = settings.tier_upgrade_notify_members !== false;

    if (!tierUpgradeEnabled) {
      return Response.json({ success: true, upgraded: 0, checked: 0, skipped: 'tier upgrades disabled in AppSettings' });
    }

    const allTiers = await base44.asServiceRole.entities.LoyaltyTier.list(null, 100);
    // Eligible tiers = active, name maps to the member tier enum, AND has a real
    // threshold (min_spending>0 or min_visits>0). Tiers with both at 0 are base
    // or flag-based (e.g. Regular is the default; Founding Member is conferred by
    // the is_founding_member flag, not earned by spend) — they must never be
    // spend-promotion targets or every member would instantly qualify for them.
    const eligible = allTiers
      .filter((t) =>
        t.is_active !== false &&
        TIER_RANK[t.name] != null &&
        (Number(t.min_spending) > 0 || Number(t.min_visits) > 0))
      .sort((a, b) => TIER_RANK[b.name] - TIER_RANK[a.name]);

    if (eligible.length === 0) {
      return Response.json({ success: true, upgraded: 0, checked: 0, skipped: 'no eligible tiers configured' });
    }

    const members = await base44.asServiceRole.entities.TapRoomMember.list('-created_date', 1000);
    const active = members.filter((m) => (m.status || 'Active') === 'Active');

    // Compute the cutoff date for the min-days-as-member gate.
    let minJoinedDate = null;
    if (minDaysAsMember > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - minDaysAsMember);
      minJoinedDate = cutoff.toISOString().slice(0, 10);
    }

    const toUpgrade = [];
    let skippedByAge = 0;
    for (const m of active) {
      // Gate on membership tenure: a member who joined too recently is not yet
      // eligible, even if their spend/visits already cross a threshold.
      if (minJoinedDate && m.joined_date && m.joined_date > minJoinedDate) {
        skippedByAge++;
        continue;
      }

      const spend = Number(m.total_spend) || 0;
      const visits = Number(m.total_visits) || 0;
      const currentRank = TIER_RANK[m.tier] != null ? TIER_RANK[m.tier] : 0;

      // eligible is sorted desc by rank, so the first qualifying tier is the highest.
      let best = null;
      for (const t of eligible) {
        if (spend >= (Number(t.min_spending) || 0) && visits >= (Number(t.min_visits) || 0)) {
          best = t;
          break;
        }
      }
      if (best && TIER_RANK[best.name] > currentRank) {
        toUpgrade.push({ id: m.id, tier: best.name, guest_name: m.guest_name, email: m.email, from: m.tier || 'Regular' });
      }
    }

    let upgraded = 0;
    if (toUpgrade.length > 0) {
      await base44.asServiceRole.entities.TapRoomMember.bulkUpdate(
        toUpgrade.map((u) => ({ id: u.id, tier: u.tier })),
      );
      upgraded = toUpgrade.length;

      // Send congratulatory emails to upgraded members if enabled.
      if (notifyMembers) {
        for (const u of toUpgrade) {
          if (!u.email) continue;
          try {
            await sendTierUpgradeEmail(base44, u);
          } catch (mailErr) {
            console.error(`upgradeMemberTiers: email to ${u.email} failed`, mailErr);
          }
        }
      }

      await notifyAdmins(base44, {
        subject: `Tap Room tier upgrades: ${upgraded} member(s) promoted`,
        body: `The daily tier-upgrade job promoted ${upgraded} member(s):<br><br>${toUpgrade
          .map((u) => `${u.guest_name} (${u.email}) — ${u.from} &rarr; <strong>${u.tier}</strong>`)
          .join('<br>')}`,
      }).catch(() => {});
    }

    return Response.json({ success: true, upgraded, checked: active.length, skippedByAge });
  } catch (error) {
    console.error('upgradeMemberTiers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function sendTierUpgradeEmail(base44, upgrade) {
  const subject = `You've been promoted to ${upgrade.tier}! 🎉`;
  const body = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:24px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Tap Room Society</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Congratulations, ${esc(upgrade.guest_name || 'Valued Member')}!</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Your loyalty has earned you a tier upgrade. You've been promoted from <strong>${esc(upgrade.from)}</strong> to <strong>${esc(upgrade.tier)}</strong>.</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#777;">Your new tier</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:bold;color:#C89B4F;">${esc(upgrade.tier)}</p>
      </div>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">Thank you for being a valued part of the JTAP Kitchen family. Enjoy your new tier perks on your next visit!</p>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431</p>
    </div>
  </div>
</body></html>`;
  await sendTransactionalEmail(base44, { to: upgrade.email, subject, body, from_name: 'JTAP Kitchen' });
}