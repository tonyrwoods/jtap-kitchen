import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

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

    const toUpgrade = [];
    for (const m of active) {
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
      await notifyAdmins(base44, {
        subject: `Tap Room tier upgrades: ${upgraded} member(s) promoted`,
        body: `The daily tier-upgrade job promoted ${upgraded} member(s):<br><br>${toUpgrade
          .map((u) => `${u.guest_name} (${u.email}) — ${u.from} &rarr; <strong>${u.tier}</strong>`)
          .join('<br>')}`,
      }).catch(() => {});
    }

    return Response.json({ success: true, upgraded, checked: active.length });
  } catch (error) {
    console.error('upgradeMemberTiers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}