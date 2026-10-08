// Shared HMAC token generation/verification for pay-at-table bill access.
// The QR code on each table plaque includes a signed token so the public
// getTableBill endpoint can verify the request came from a real table QR
// code, not from someone enumerating table numbers.

const encoder = new TextEncoder();

async function getKey() {
  const secret = Deno.env.get('TABLE_BILL_HMAC_SECRET');
  if (!secret) throw new Error('TABLE_BILL_HMAC_SECRET not set');
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

export async function generateTableBillToken(tableNumber) {
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode('table_bill:' + String(tableNumber)));
  return toHex(sig);
}

export async function verifyTableBillToken(tableNumber, token) {
  if (!token) return false;
  try {
    const expected = await generateTableBillToken(tableNumber);
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