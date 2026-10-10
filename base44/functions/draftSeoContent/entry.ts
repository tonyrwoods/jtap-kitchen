import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// SEO Content Agent — autonomous agent that generates SEO-optimized content
// (title, meta description, OG tags, H1, intro paragraph, keywords, and
// schema.org Event JSON-LD) for upcoming EventPromotion landing pages. Drafts
// are saved for admin review; when an admin marks a draft "Applied", the live
// event announcement page reads it and overrides the default meta + injects the
// JSON-LD. Runs daily via the scheduled workflow. Narrow app op.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only: scheduled runs execute as the workflow owner (admin).
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const promotions = await base44.asServiceRole.entities.EventPromotion.list('-date', 30);
  const upcoming = promotions.filter((p) => p.is_active && p.date && p.date >= todayStr);

  const existing = await base44.asServiceRole.entities.SeoContentDraft.list('-created_date', 100);
  const have = new Set(existing.map((d) => d.promotion_id));

  const toDraft = upcoming.filter((p) => !have.has(p.id));
  if (toDraft.length === 0) return Response.json({ drafted: 0, total: 0 });

  let drafted = 0;
  const errors = [];
  for (const promo of toDraft) {
    try {
      const shareUrl = promo.share_slug ? `https://jtapkitchen.com/event-announce/${promo.share_slug}` : '';
      const prompt = `You are an SEO specialist for JTAP Kitchen, a refined small-plates restaurant in Memphis, TN. Generate SEO content for this event's landing page so it ranks for local "things to do in Memphis" and "Memphis dining events" queries.

Event:
Title: ${promo.title}
Subtitle: ${promo.subtitle || ''}
Type: ${promo.event_type || ''}
Date: ${promo.date}
Start time: ${promo.time || ''}${promo.end_time ? ` End: ${promo.end_time}` : ''}
Location: ${promo.location_label || 'JTAP Kitchen — Memphis, TN'}
Price: ${promo.price_per_guest ? `$${promo.price_per_guest}/guest` : 'Complimentary'}
Description: ${promo.description || ''}
URL: ${shareUrl}

Produce:
1. seo_title: HTML <title>, ≤60 chars, include "Memphis" and the event essence.
2. meta_description: ≤160 chars, compelling, include the date + Memphis + a reason to attend.
3. og_title: social share title, ≤65 chars.
4. og_description: social share description, ≤160 chars.
5. h1: on-page H1, ≤80 chars.
6. body_intro: a 2-3 sentence SEO intro paragraph (plain text) incorporating "Memphis" and the event type.
7. keywords: 5-8 comma-separated keywords.
8. json_ld: a JSON-LD schema.org Event object as a stringified JSON string, with @type "Event", name, startDate (ISO 8601 with time if available), eventStatus "https://schema.org/EventScheduled", eventAttendanceMode "https://schema.org/OfflineEventAttendanceMode", location (a Place with name and address "Memphis, TN"), description, url. Include offers only if a price is given. Omit fields with no value.

Return ONLY a JSON object with exactly those 8 keys. No prose.`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            seo_title: { type: 'string' },
            meta_description: { type: 'string' },
            og_title: { type: 'string' },
            og_description: { type: 'string' },
            h1: { type: 'string' },
            body_intro: { type: 'string' },
            keywords: { type: 'string' },
            json_ld: { type: 'string' },
          },
          required: ['seo_title', 'meta_description', 'json_ld'],
        },
      });

      const d = result && typeof result === 'object' ? result : null;
      if (!d || !d.seo_title) { errors.push({ id: promo.id, error: 'invalid LLM response' }); continue; }

      await base44.asServiceRole.entities.SeoContentDraft.create({
        promotion_id: promo.id,
        promotion_title: promo.title,
        share_slug: promo.share_slug || '',
        seo_title: String(d.seo_title || ''),
        meta_description: String(d.meta_description || ''),
        og_title: String(d.og_title || ''),
        og_description: String(d.og_description || ''),
        h1: String(d.h1 || ''),
        body_intro: String(d.body_intro || ''),
        keywords: String(d.keywords || ''),
        json_ld: String(d.json_ld || ''),
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