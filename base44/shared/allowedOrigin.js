// Trust only an explicit allowlist of origins for email action links and
// other token-bearing URLs. Never reflect an arbitrary request Origin
// header (open-redirect / token leak). Used by email-sending functions
// that embed secret tokens in links.

const ALLOWED_ORIGINS = new Set([
  'https://jtapkitchen.base44.app',
  'https://jtapkitchen.com',
  'https://www.jtapkitchen.com',
]);

const DEFAULT_ORIGIN = 'https://jtapkitchen.com';

export function getAllowedOrigin(req) {
  const requestOrigin = req.headers.get('origin');
  return requestOrigin && ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : DEFAULT_ORIGIN;
}