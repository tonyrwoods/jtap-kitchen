import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { enforceRateLimit } from '../../shared/rateLimit.js';

const TIER_DEFAULTS = {
  'Regular': { private_room_access: false, free_rentals_remaining: 0, welcome_credit_issued: 0, welcome_credit_remaining: 0, annual_fee_amount: 0, is_founding_member: false, tier_earned_or_paid: 'Free' },
  'Reserve Member': { private_room_access: true, free_rentals_remaining: 1, welcome_credit_issued: 50, welcome_credit_remaining: 50, annual_fee_amount: 99, is_founding_member: false, tier_earned_or_paid: 'Paid Annual Fee' },
  'Founding Member': { private_room_access: true, free_rentals_remaining: 2, welcome_credit_issued: 100, welcome_credit_remaining: 100, annual_fee_amount: 249, is_founding_member: true, tier_earned_or_paid: 'Paid Annual Fee' },
};

function generateReferralCode(name) {
  const clean = (name || '').replace(/\s+/g, '').toUpperCase().slice(0, 4);
  return clean + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { guest_name, email, phone, birthday_month, birthday_day, how_heard, tier, referred_by_code } = body;

    if (!guest_name || !email) {
      return Response.json({ error: 'Name and email are required.' }, { status: 400 });
    }
    if (!TIER_DEFAULTS[tier]) {
      return Response.json({ error: 'Invalid membership tier.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'signupTapRoomMember', email.toLowerCase(), 1, 3600000);
    if (limited) return limited;

    const tierData = TIER_DEFAULTS[tier];
    const today = new Date().toISOString().split('T')[0];

    // All financial/points/founding fields are forced server-side — submitters cannot self-elevate.
    const member = await base44.asServiceRole.entities.TapRoomMember.create({
      guest_name,
      email,
      phone: phone || '',
      birthday_month: birthday_month ? parseInt(birthday_month) : undefined,
      birthday_day: birthday_day ? parseInt(birthday_day) : undefined,
      how_heard: how_heard || '',
      tier,
      referred_by_code: referred_by_code || '',
      joined_date: today,
      status: 'Active',
      points_balance: 0,
      total_points_earned: 0,
      total_points_redeemed: 0,
      total_visits: 0,
      total_spend: 0,
      current_year_spend: 0,
      referral_code: generateReferralCode(guest_name),
      referral_count: 0,
      referral_reward_awarded: false,
      annual_fee_paid: false,
      ...tierData,
    });

    // Welcome email — Gmail delivers to external (non-registered) addresses.
    const creditLine = tierData.welcome_credit_issued > 0 ? `Welcome credit: $${tierData.welcome_credit_issued}\n` : '';
    const accessLine = tierData.private_room_access ? 'Private Room Access: UNLOCKED\n' : '';
    await sendTransactionalEmail(base44, {
      to: email,
      subject: 'Welcome to The Tap Room Society — JTAP Kitchen',
      body: `Hi ${guest_name},\n\nYou're officially in.\n\nWelcome to The Tap Room Society.\n\nYour tier: ${tier}\n${creditLine}${accessLine}\nSee you at the table.\n\n— The JTAP Kitchen Team`,
    });

    return Response.json({ success: true, member });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}