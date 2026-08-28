import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let email = url.searchParams.get('email');
    if (!email) {
      const body = await req.json().catch(() => ({}));
      email = body.email;
    }
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
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