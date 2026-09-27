import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// GBP Post Drafter Agent — autonomous agent that drafts Google Business Profile
// "Event" posts for upcoming EventPromotions. Since there is no Google Business
// Profile API connector, the agent produces ready-to-paste post text (and a CTA
// + share URL) saved as a Draft for an admin to copy into GBP manually. Runs
// daily via the scheduled workflow. Narrow app op: prompt built server-side.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const todayStr = new Date().toISOString().split('T')[0];

  const promotions = await base44.asServiceRole.entities.EventPromotion.list('-date', 30);
  const upcoming = promotions.filter((p) => p.is_active && p.date && p.date >= todayStr);

  const existing = await base44.asServiceRole.entities.GbpPostDraft.list('-created_date', 100);
  const have = new Set(existing.map((d) => d.promotion_id));

  const toDraft = upcoming.filter((p) => !have.has(p.id));
  if (toDraft.length === 0) return Response.json({ drafted: 0, total: 0 });

  let drafted = 0;
  const errors = [];
  for (const promo of toDraft) {
    try {
      const prompt = `You are writing a Google Business Profile post for JTAP Kitchen, a refined small-plates restaurant in Memphis, TN.

Event details:
Title: ${promo.title}
Subtitle: ${promo.subtitle || ''}
Type: ${promo.event_type || ''}
Date: ${promo.date}
Time: ${promo.time || ''}${promo.end_time ? `–${promo.end_time}` : ''}
Location: ${promo.location_label || 'JTAP Kitchen — Memphis, TN'}
Price: ${promo.price_per_guest ? `$${promo.price_per_guest}/guest` : 'Complimentary'}
Description: ${promo.description || ''}

Write a Google Business Profile "Event" post. Requirements:
- Body text between 100 and 1500 characters, plain text (no HTML, no markdown).
- Engaging, specific, and inviting. Mention the date and what makes the event special.
- End with a soft call-to-action to reserve or RSVP.
- Do not invent facts, menu items, or prices not given above.
- Output ONLY the post body text, nothing else.`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      const post_text = (typeof result === 'string' ? result : (result?.text || result?.content || '')).toString().trim().slice(0, 1500);
      if (!post_text) { errors.push({ id: promo.id, error: 'empty LLM response' }); continue; }

      await base44.asServiceRole.entities.GbpPostDraft.create({
        promotion_id: promo.id,
        promotion_title: promo.title,
        post_type: 'Event',
        post_text,
        cta_label: 'Book',
        event_date: promo.date,
        share_url: promo.share_slug ? `https://jtapkitchen.com/event-announce/${promo.share_slug}` : '',
        status: 'Draft',
        generated_at: new Date().toISOString(),
      });
      drafted++;
    } catch (err) {
      errors.push({ id: promo.id, error: err.message });
    }
  }

  return Response.json({ drafted, total: toDraft.length, errors });
});