import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let id;
    try { id = (await req.json())?.id; } catch {}
    if (!id) {
      const url = new URL(req.url);
      id = url.searchParams.get('id');
    }
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    // Public endpoint (backs the post-checkout deposit-confirmed page, which must
    // be reachable without login) — the inquiry id acts as the capability token.
    // Rate-limit by id to blunt enumeration/abuse.
    const rl = await enforceRateLimit(req, base44, 'getEventInquiryPublic', id, 30, 600000);
    if (rl) return rl;

    const inq = await base44.asServiceRole.entities.EventCenterInquiry.get(id);
    if (!inq) return Response.json({ error: 'not found' }, { status: 404 });

    return Response.json({
      id: inq.id,
      contact_name: inq.contact_name,
      package: inq.package,
      package_name: inq.package_name,
      preferred_date: inq.preferred_date,
      event_date: inq.event_date,
      guest_count: inq.guest_count,
      event_type: inq.event_type,
      deposit_amount: inq.deposit_amount,
      deposit_status: inq.deposit_status,
      estimated_total: inq.estimated_total,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}