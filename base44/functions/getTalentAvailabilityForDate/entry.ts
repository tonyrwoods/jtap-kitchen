import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

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

    return Response.json({
      date,
      unavailable: Array.from(blocked),
      dateBooked: confirmed.length > 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}