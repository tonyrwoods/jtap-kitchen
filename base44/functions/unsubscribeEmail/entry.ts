import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { secrets } from 'base44:runtime';

// Only accept requests that originate from this app's own domain.
// The function's public URL can be called by anyone, so we require a
// browser Origin (or Referer) whose host matches the request's own Host
// — i.e. a same-origin call from the site — before modifying subscriber
// status. Direct hits to the raw function URL are rejected.
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

Deno.serve(async (req) => {
  try {
    if (!isAllowedOrigin(req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let email = url.searchParams.get('email');
    if (!email) {
      const body = await req.json().catch(() => ({}));
      email = body.email;
    }
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
    const norm = email.trim().toLowerCase();

    const rl = await enforceRateLimit(req, base44, 'unsubscribe', norm, 10, 600000);
    if (rl) return rl;

    // Unsubscribe = mark the Subscriber record inactive. If the email isn't a
    // subscriber yet, create an inactive record so the preference is preserved.
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email: norm });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.Subscriber.update(existing[0].id, { is_active: false });
    } else {
      await base44.asServiceRole.entities.Subscriber.create({ email: norm, is_active: false });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});