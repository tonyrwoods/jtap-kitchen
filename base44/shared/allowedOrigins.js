// Shared Origin allowlist for building token-bearing links in emails.
// Never reflect an arbitrary request Origin header (open-redirect / token leak).
const ALLOWED_ORIGINS = new Set([
  'https://jtapkitchen.base44.app',
  'https://jtapkitchen.com',
  'https://www.jtapkitchen.com',
]);
const DEFAULT_ORIGIN = 'https://jtapkitchen.base44.app';

export function getAllowedOrigin(req) {
  const requestOrigin = req.headers.get('origin');
  return requestOrigin && ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : DEFAULT_ORIGIN;
}