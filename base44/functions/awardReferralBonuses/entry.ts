import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Scheduled job: when a referred Tap Room Society member "converts" (their
// first real engagement — an event attendance or a recorded spend), award a
// one-time referral bonus to the member who referred them. Each referred
// member is processed exactly once, guarded by `referral_reward_awarded`
// on the referred member's record.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const settings = await base44.asServiceRole.entities.AppSettings.list().then((d) => d[0]);
    const bonusPoints = (settings && settings.referral_bonus_points) || 500;

    const members = await base44.asServiceRole.entities.TapRoomMember.list('-created_date', 1000);

    // Map referral_code (uppercased) -> referrer member for quick lookup.
    const referrerByCode = new Map();
    for (const m of members) {
      if (m.referral_code) referrerByCode.set(m.referral_code.toUpperCase(), m);
    }

    // Referred members who haven't yet earned their referrer a bonus.
    const pending = members.filter((m) => m.referred_by_code && !m.referral_reward_awarded);

    let rewardsAwarded = 0;
    let totalPoints = 0;
    const errors = [];

    for (const m of pending) {
      try {
        // Conversion = real engagement (attended an event or spent money).
        const converted = (m.total_visits || 0) > 0 || (m.total_spend || 0) > 0;
        if (!converted) continue;

        const referrer = referrerByCode.get((m.referred_by_code || '').toUpperCase());

        if (referrer) {
          const newBalance = (referrer.points_balance || 0) + bonusPoints;
          await base44.asServiceRole.entities.TapRoomMember.update(referrer.id, {
            points_balance: newBalance,
            total_points_earned: (referrer.total_points_earned || 0) + bonusPoints,
          });

          await base44.asServiceRole.entities.PointsActivity.create({
            member_id: referrer.id,
            member_name: referrer.guest_name,
            member_email: referrer.email,
            transaction_type: 'Bonus',
            points: bonusPoints,
            balance_after: newBalance,
            trigger: 'referral',
            description: `Referral bonus — ${m.guest_name} joined and visited`,
            transaction_date: new Date().toISOString().split('T')[0],
          });

          rewardsAwarded += 1;
          totalPoints += bonusPoints;
        }

        // Mark the referred member processed (covers both awarded and
        // referrer-no-longer-a-member) so we never re-scan them.
        await base44.asServiceRole.entities.TapRoomMember.update(m.id, { referral_reward_awarded: true });
      } catch (err) {
        errors.push({ member: m.email, error: err.message });
      }
    }

    return Response.json({ success: true, checked: pending.length, rewardsAwarded, totalPoints, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});