import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — prevents anonymous spam and NPS poisoning
    let user;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) {
      return Response.json({ error: 'Authentication required to submit feedback' }, { status: 401 });
    }

    const { guest_name, email, nps_score, what_went_well, what_could_improve, would_recommend, reservation_id, visit_date } = await req.json();

    if (!guest_name || !email || nps_score === undefined) {
      return Response.json({ error: 'guest_name, email, and nps_score are required' }, { status: 400 });
    }

    const score = Number(nps_score);
    if (isNaN(score) || score < 0 || score > 10) {
      return Response.json({ error: 'nps_score must be between 0 and 10' }, { status: 400 });
    }

    // Rate limit by email to prevent spam
    const rl = await enforceRateLimit(req, base44, 'guest-feedback', email, 5, 3600000);
    if (rl) return rl;

    const feedback = await base44.asServiceRole.entities.GuestFeedback.create({
      guest_name,
      email,
      reservation_id: reservation_id || null,
      visit_date: visit_date || null,
      nps_score: score,
      what_went_well: what_went_well || null,
      what_could_improve: what_could_improve || null,
      would_recommend: would_recommend !== undefined && would_recommend !== null ? Boolean(would_recommend) : null,
      status: 'Pending',
    });

    // Update guest profile NPS only when the authenticated user's email matches
    // — prevents poisoning another guest's NPS score
    try {
      if (user.email && user.email.toLowerCase() === String(email).toLowerCase()) {
        const profiles = await base44.asServiceRole.entities.GuestProfile.filter(
          { email }, { limit: 1, fields: ['id'] }
        );
        if (profiles.items?.[0]) {
          await base44.asServiceRole.entities.GuestProfile.update(profiles.items[0].id, {
            nps_score: score,
            last_nps_date: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.log('Could not update guest profile NPS:', e.message);
    }

    return Response.json({ status: 'success', feedback_id: feedback.id });
  } catch (error) {
    console.error('Error in submitGuestFeedback:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}