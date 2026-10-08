import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const { guest_name, email, nps_score, what_went_well, what_could_improve, would_recommend, reservation_id, visit_date } = await req.json();

    if (!guest_name || !email || nps_score === undefined) {
      return Response.json({ error: 'guest_name, email, and nps_score are required' }, { status: 400 });
    }

    const score = Number(nps_score);
    if (isNaN(score) || score < 0 || score > 10) {
      return Response.json({ error: 'nps_score must be between 0 and 10' }, { status: 400 });
    }

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

    // Update guest profile NPS if it exists
    try {
      const profiles = await base44.asServiceRole.entities.GuestProfile.filter(
        { email }, { limit: 1, fields: ['id'] }
      );
      if (profiles.items?.[0]) {
        await base44.asServiceRole.entities.GuestProfile.update(profiles.items[0].id, {
          nps_score: score,
          last_nps_date: new Date().toISOString(),
        });
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