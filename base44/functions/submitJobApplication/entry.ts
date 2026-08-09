import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      applicant_name, email, phone, experience_years,
      cover_letter, resume_url, job_listing_id, job_title,
    } = body;

    if (!applicant_name || !email || !job_listing_id) {
      return Response.json({ error: 'Name, email, and job are required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'submitJobApplication', String(email).toLowerCase(), 2, 86400000);
    if (limited) return limited;

    // Force server-controlled fields (status + all admin/interview tracking).
    const application = await base44.asServiceRole.entities.JobApplication.create({
      applicant_name,
      email,
      phone: phone || null,
      experience_years: Number(experience_years) || 0,
      cover_letter: cover_letter || null,
      resume_url: resume_url || null,
      job_listing_id,
      job_title: job_title || null,
      status: 'New',
    });

    return Response.json({ success: true, application });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}