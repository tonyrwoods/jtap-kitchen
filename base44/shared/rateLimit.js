// Per-key sliding-window rate limiting backed by the RateLimitEntry entity.
// Best-effort abuse guard for low-volume public submission endpoints — a thin
// flood/abuse throttle, not a hard concurrency guarantee (no atomic increment).

const IP_LIMIT = 20;
const IP_WINDOW_MS = 60000;

export function getClientIp(req) {
  return req.headers.get('cf-connecting-ip')
    || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || null;
}

async function check(base44, key, limit, windowMs) {
  const now = Date.now();
  const entries = await base44.asServiceRole.entities.RateLimitEntry.filter({ key }, '-created_date', 1);
  const entry = entries[0];
  const windowStart = entry ? new Date(entry.window_start).getTime() : 0;

  // New window (or first-ever request for this key): reset the counter.
  if (!entry || now - windowStart > windowMs) {
    if (entry) {
      await base44.asServiceRole.entities.RateLimitEntry.update(entry.id, {
        count: 1,
        window_start: new Date(now).toISOString(),
      });
    } else {
      await base44.asServiceRole.entities.RateLimitEntry.create({
        key,
        count: 1,
        window_start: new Date(now).toISOString(),
      });
    }
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false };
  }

  await base44.asServiceRole.entities.RateLimitEntry.update(entry.id, { count: entry.count + 1 });
  return { allowed: true };
}

// Returns a 429 Response if blocked, otherwise null.
// IP limit is a coarse flood guard (fixed window); per-email limit is the meaningful one.
export async function enforceRateLimit(req, base44, action, emailKey, perEmailLimit, windowMs) {
  const ip = getClientIp(req);
  if (ip) {
    const r = await check(base44, `${action}:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
    if (!r.allowed) {
      return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }
  }
  if (emailKey) {
    const r = await check(base44, `${action}:email:${emailKey}`, perEmailLimit, windowMs);
    if (!r.allowed) {
      return Response.json({ error: 'You have reached the submission limit. Please try again later.' }, { status: 429 });
    }
  }
  return null;
}