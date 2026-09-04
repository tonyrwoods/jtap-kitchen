import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

// Public submission endpoint for a promotion "Customer Scorecard".
// Guests rate Dishes, Service, and Atmosphere (1–5) and may leave a comment.
// Submissions are always created as "Pending" — an admin moderates before they
// appear publicly. The promotion is resolved server-side from share_slug so
// promotion_id / promotion_title / share_slug are cached correctly and can't
// be spoofed by the client.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      share_slug, promotion_id,
      guest_name, email,
      dishes_rating, service_rating, atmosphere_rating,
      comment, visit_date,
    } = body;

    if (!share_slug && !promotion_id) {
      return Response.json({ error: 'Promotion is required.' }, { status: 400 });
    }
    if (!guest_name || !String(guest_name).trim()) {
      return Response.json({ error: 'Your name is required.' }, { status: 400 });
    }
    for (const [label, val] of [
      ['Dishes rating', dishes_rating],
      ['Service rating', service_rating],
      ['Atmosphere rating', atmosphere_rating],
    ]) {
      const n = Number(val);
      if (!n || n < 1 || n > 5 || !Number.isInteger(n)) {
        return Response.json({ error: `${label} must be a whole number from 1 to 5.` }, { status: 400 });
      }
    }

    // Rate limit by email when available, otherwise by IP bucket.
    const bucket = (email || '').toString().toLowerCase().trim() || (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim();
    const limited = await enforceRateLimit(req, base44, 'submitPromotionScorecard', bucket, 3, 86400000);
    if (limited) return limited;

    // Resolve the promotion so the record caches correct identifiers.
    let promo;
    if (share_slug) {
      const found = await base44.asServiceRole.entities.EventPromotion.filter({ share_slug });
      promo = found[0];
    } else if (promotion_id) {
      try { promo = await base44.asServiceRole.entities.EventPromotion.get(promotion_id); } catch (_) { promo = null; }
    }
    if (!promo) {
      return Response.json({ error: 'Promotion not found.' }, { status: 404 });
    }

    const scorecard = await base44.asServiceRole.entities.PromotionScorecard.create({
      promotion_id: promo.id,
      promotion_title: promo.title,
      share_slug: promo.share_slug,
      guest_name: String(guest_name).trim(),
      email: (email || '').toString().trim().toLowerCase(),
      dishes_rating: Number(dishes_rating),
      service_rating: Number(service_rating),
      atmosphere_rating: Number(atmosphere_rating),
      comment: (comment || '').toString().trim(),
      visit_date: visit_date || promo.date || '',
      status: 'Pending',
      is_featured: false,
    });

    return Response.json({ success: true, scorecard });
  } catch (error) {
    console.error('submitPromotionScorecard error:', error);
    return Response.json({ error: error.message || 'Failed to submit scorecard.' }, { status: 500 });
  }
}