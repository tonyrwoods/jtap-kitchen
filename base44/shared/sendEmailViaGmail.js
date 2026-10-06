/**
 * Sends an email via the connected Gmail account.
 * Uses the Gmail API with the builder's authorized Gmail connector (SHARED mode).
 *
 * Supports optional file attachments. Attachments must be pre-encoded by the
 * caller as { filename, contentType, base64 } so a multi-recipient campaign
 * only fetches/encodes each file once.
 *
 * @param {object} base44 - The base44 client (from createClientFromRequest)
 * @param {object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.body - HTML email body
 * @param {Array<{filename:string,contentType:string,base64:string}>} [opts.attachments]
 * @returns {Promise<{id: string, threadId: string}>} - Gmail API response
 */
export async function sendEmailViaGmail(base44, { to, subject, body, attachments = [] }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  // RFC 2047 encode subject if it contains non-ASCII characters (emoji, accents, etc.)
  const encodedSubject = /^[\x00-\x7F]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${base64FromUtf8(subject)}?=`;

  const validAttachments = Array.isArray(attachments) ? attachments.filter(a => a && a.base64) : [];
  const hasAttachments = validAttachments.length > 0;

  let mimeMessage;
  if (hasAttachments) {
    const boundary = `jtap_boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const lines = [
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      body,
    ];
    for (const att of validAttachments) {
      const filename = String(att.filename || 'attachment').replace(/"/g, "'");
      const ct = att.contentType || 'application/octet-stream';
      lines.push(
        ``,
        `--${boundary}`,
        `Content-Type: ${ct}`,
        `Content-Disposition: attachment; filename="${filename}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        att.base64
      );
    }
    lines.push(``, `--${boundary}--`);
    mimeMessage = lines.join('\r\n');
  } else {
    mimeMessage = [
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      body,
    ].join('\r\n');
  }

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