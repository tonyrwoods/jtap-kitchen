import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { secrets } from 'base44:runtime';

// Only accept submissions that originate from this app's own domain.
// The function's public URL can be called by anyone, so we require a
// browser Origin (or Referer) whose host matches the request's own Host
// — i.e. a same-origin call from the site — before creating records.
// Direct hits to the raw function URL are rejected.
function isAllowedOrigin(req) {
  const origin = (req.headers.get('origin') || '').toLowerCase();
  const referer = (req.headers.get('referer') || '').toLowerCase();
  const host = (req.headers.get('host') || '').toLowerCase();
  if (!host) return false;
  const fromHeader = (url) => {
    if (!url) return false;
    try { return new URL(url).host.toLowerCase() === host; } catch { return false; }
  };
  if (fromHeader(origin) || fromHeader(referer)) return true;
  const appUrl = (secrets.get('APP_URL') || '').toLowerCase().replace(/\/$/, '');
  if (appUrl && (origin === appUrl || origin.startsWith(appUrl + '/') || referer === appUrl || referer.startsWith(appUrl + '/'))) return true;
  return false;
}

export default async function(req) {
  try {
    if (!isAllowedOrigin(req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
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