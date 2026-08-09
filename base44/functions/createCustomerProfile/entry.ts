import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return Response.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'createCustomerProfile', email.toLowerCase(), 5, 3600000);
    if (limited) return limited;

    // Loyalty stats and tier are forced to defaults — a user cannot inflate points/tier on signup.
    const profile = await base44.asServiceRole.entities.CustomerProfile.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      total_visits: 0,
      total_spend: 0,
      loyalty_points: 0,
      loyalty_tier: 'Bronze',
      order_history: [],
    });

    return Response.json({ success: true, profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}