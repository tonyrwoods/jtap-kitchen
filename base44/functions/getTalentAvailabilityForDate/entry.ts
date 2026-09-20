import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Public availability lookup for the booking wizard — no PII is returned, so
    // only the shared IP flood guard applies (no per-key throttle, so users
    // browsing multiple dates aren't blocked).
    const rl = await enforceRateLimit(req, base44, 'talentAvailability', null, 1, 600000);
    if (rl) return rl;

    let date;
    try { date = (await req.json())?.date; } catch {}
    if (!date) {
      const url = new URL(req.url);
      date = url.searchParams.get('date');
    }
    if (!date) return Response.json({ error: 'date is required' }, { status: 400 });

    const blocked = new Set();

    // (a) explicit unavailable blocks for this date
    const blocks = await base44.asServiceRole.entities.TalentAvailability.filter(
      { date, is_available: false }, 'date', 500
    );
    blocks.forEach((b) => { if (b.provider_id) blocked.add(b.provider_id); });

    // (b) talent already attached to confirmed inquiries for this date
    const confirmed = await base44.asServiceRole.entities.EventCenterInquiry.filter(
      { preferred_date: date, status: 'Confirmed' }, 'created_date', 500
    );
    confirmed.forEach((c) => {
      (c.selected_talent_ids || []).forEach((id) => blocked.add(id));
    });

    // add-on booking counts across confirmed inquiries for this date
    const addonCounts = {};
    confirmed.forEach((c) => {
      (c.selected_addon_ids || []).forEach((id) => { addonCounts[id] = (addonCounts[id] || 0) + 1; });
    });

    // A date is also booked when someone has already paid a deposit for it
    // (not yet admin-confirmed). Keeps the client warning and the server-side
    // payment guard in create-event-deposit-checkout consistent.
    const paid = await base44.asServiceRole.entities.EventCenterInquiry.filter(
      { preferred_date: date, deposit_status: 'Paid' }, 'created_date', 500
    );

    return Response.json({
      date,
      unavailable: Array.from(blocked),
      dateBooked: confirmed.length > 0 || paid.length > 0,
      addonCounts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}