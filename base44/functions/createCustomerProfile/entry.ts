import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

function generateReferralCode(name) {
  const clean = (name || '').replace(/\s+/g, '').toUpperCase().slice(0, 4);
  return clean + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Require an authenticated staff/admin caller — this is a POS operation,
    // not a public self-signup. Public signups go through signupTapRoomMember.
    let user;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'staff') {
      return Response.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return Response.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'createCustomerProfile', email.toLowerCase(), 5, 3600000);
    if (limited) return limited;

    const today = new Date().toISOString().split('T')[0];

    // Creates a Regular-tier TapRoomMember. All financial/points fields are
    // forced to defaults — callers cannot inflate points or self-elevate tier.
    const member = await base44.asServiceRole.entities.TapRoomMember.create({
      guest_name: name,
      email: email.toLowerCase(),
      phone: phone || '',
      tier: 'Regular',
      tier_earned_or_paid: 'Free',
      joined_date: today,
      status: 'Active',
      points_balance: 0,
      total_points_earned: 0,
      total_points_redeemed: 0,
      total_visits: 0,
      total_spend: 0,
      current_year_spend: 0,
      referral_code: generateReferralCode(name),
      referral_count: 0,
      referral_reward_awarded: false,
      annual_fee_paid: false,
      welcome_credit_issued: 0,
      welcome_credit_remaining: 0,
      is_founding_member: false,
      private_room_access: false,
      free_rentals_remaining: 0,
    });

    return Response.json({ success: true, profile: member });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}