import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

// Public endpoint: returns the candidate's application + open interview slots
// for the self-scheduling page. Uses the service role so the admin-only
// InterviewSlot reads are exposed in a controlled, minimal way (id/date/time/
// location only — no other applicants' data).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let application_id;
    const url = new URL(req.url);
    application_id = url.searchParams.get('application_id');
    if (!application_id) {
      const body = await req.json().catch(() => ({}));
      application_id = body.application_id;
    }
    if (!application_id) return Response.json({ error: 'application_id required' }, { status: 400 });

    const rl = await enforceRateLimit(req, base44, 'interview-context', application_id, 20, 600000);
    if (rl) return rl;

    const apps = await base44.asServiceRole.entities.JobApplication.filter({ id: application_id });
    const application = apps[0];
    if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });

    const allSlots = await base44.asServiceRole.entities.InterviewSlot.filter({ is_booked: false }, 'date', 100);
    const today = new Date().toISOString().slice(0, 10);
    const slots = allSlots
      .filter((s) => s.date && s.date >= today)
      .map((s) => ({ id: s.id, date: s.date, start_time: s.start_time, end_time: s.end_time, location: s.location }));

    return Response.json({
      application: {
        id: application.id,
        applicant_name: application.applicant_name,
        email: application.email,
        job_title: application.job_title,
      },
      slots,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}