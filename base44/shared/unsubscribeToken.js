// Shared HMAC token generation/verification for unsubscribe links.
// Uses the Web Crypto API (available in Deno backend functions) with an
// app secret to sign the email, so unsubscribe links can't be forged by
// an attacker who only knows a subscriber's email address.

const encoder = new TextEncoder();

async function getKey() {
  const secret = Deno.env.get('UNSUBSCRIBE_HMAC_SECRET');
  if (!secret) throw new Error('UNSUBSCRIBE_HMAC_SECRET not set');
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateUnsubscribeToken(email) {
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(email.trim().toLowerCase()));
  return toHex(sig);
}

export async function verifyUnsubscribeToken(email, token) {
  if (!email || !token) return false;
  try {
    const expected = await generateUnsubscribeToken(email);
    if (expected.length !== token.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}