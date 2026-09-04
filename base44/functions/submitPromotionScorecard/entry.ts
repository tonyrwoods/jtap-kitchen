import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

// Public submission endpoint for a promotion "Customer Scorecard".
// Guests rate Dishes, Service, Atmosphere (required) plus optional
// Presentation, Value, and Hospitality (1–5), may name a favorite dish,
// and leave a free-text comment. Submissions are always created as
// "Pending" — an admin moderates before they appear publicly. The
// promotion is resolved server-side from share_slug so promotion_id /
// promotion_title / share_slug are cached correctly and can't be
// spoofed by the client.

const REQUIRED_RATINGS = [
  ['dishes_rating', 'Dishes rating'],
  ['service_rating', 'Service rating'],
  ['atmosphere_rating', 'Atmosphere rating'],
];
const OPTIONAL_RATINGS = [
  ['presentation_rating', 'Presentation rating'],
  ['value_rating', 'Value rating'],
  ['hospitality_rating', 'Hospitality rating'],
];

function normalizeRating(val, label, required) {
  const n = Number(val);
  if (required) {
    if (!n || n < 1 || n > 5 || !Number.isInteger(n)) {
      return { error: `${label} must be a whole number from 1 to 5.` };
    }
    return { value: n };
  }
  if (val === undefined || val === null || val === '' ) return { value: 0 };
  if (!n || n < 1 || n > 5 || !Number.isInteger(n)) {
    return { error: `${label} must be a whole number from 1 to 5.` };
  }
  return { value: n };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      share_slug, promotion_id,
      guest_name, email,
      dishes_rating, presentation_rating, service_rating, atmosphere_rating, value_rating, hospitality_rating,
      favorite_dish, comment, visit_date,
    } = body;

    if (!share_slug && !promotion_id) {
      return Response.json({ error: 'Promotion is required.' }, { status: 400 });
    }
    if (!guest_name || !String(guest_name).trim()) {
      return Response.json({ error: 'Your name is required.' }, { status: 400 });
    }

    const ratingPayload = {};
    for (const [key, label] of REQUIRED_RATINGS) {
      const r = normalizeRating(body[key], label, true);
      if (r.error) return Response.json({ error: r.error }, { status: 400 });
      ratingPayload[key] = r.value;
    }
    for (const [key, label] of OPTIONAL_RATINGS) {
      const r = normalizeRating(body[key], label, false);
      if (r.error) return Response.json({ error: r.error }, { status: 400 });
      ratingPayload[key] = r.value;
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
      ...ratingPayload,
      favorite_dish: (favorite_dish || '').toString().trim(),
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