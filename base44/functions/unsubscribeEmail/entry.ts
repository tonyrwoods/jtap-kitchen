import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { verifyUnsubscribeToken } from '../../shared/unsubscribeToken.js';

// Unsubscribe links carry an HMAC token (signed with UNSUBSCRIBE_HMAC_SECRET)
// so an attacker who only knows a subscriber's email cannot forge a valid
// unsubscribe URL. The token is generated when the campaign email is sent
// (see shared/sendCampaignById.js) and verified here before any state changes.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let email = url.searchParams.get('email');
    let token = url.searchParams.get('token');
    if (!email || !token) {
      const body = await req.json().catch(() => ({}));
      email = email || body.email;
      token = token || body.token;
    }
    if (!email || !token) return Response.json({ error: 'Email and token required' }, { status: 400 });

    const valid = await verifyUnsubscribeToken(email, token);
    if (!valid) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    const norm = email.trim().toLowerCase();

    const rl = await enforceRateLimit(req, base44, 'unsubscribe', norm, 10, 600000);
    if (rl) return rl;

    // Unsubscribe = mark the Subscriber record inactive. If the email isn't a
    // subscriber yet, create an inactive record so the preference is preserved.
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email: norm });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.Subscriber.update(existing[0].id, { is_active: false });
    } else {
      await base44.asServiceRole.entities.Subscriber.create({ email: norm, is_active: false });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});