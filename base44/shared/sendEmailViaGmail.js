/**
 * Sends an email via the connected Gmail account.
 * Uses the Gmail API with the builder's authorized Gmail connector (SHARED mode).
 *
 * @param {object} base44 - The base44 client (from createClientFromRequest)
 * @param {object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.body - HTML email body
 * @returns {Promise<{id: string, threadId: string}>} - Gmail API response
 */
export async function sendEmailViaGmail(base44, { to, subject, body }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  // RFC 2047 encode subject if it contains non-ASCII characters (emoji, accents, etc.)
  const encodedSubject = /^[\x00-\x7F]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${base64FromUtf8(subject)}?=`;

  // Build RFC 2822 MIME message (From header omitted — Gmail sets it from the authenticated account)
  const mimeMessage = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    body,
  ].join('\r\n');

  const raw = base64UrlEncode(mimeMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail send failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/** Convert a UTF-8 string to a base64 string (handles emoji and non-ASCII correctly). */
function base64FromUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Base64url-encode a UTF-8 string (for Gmail API raw message field). */
function base64UrlEncode(str) {
  return base64FromUtf8(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}