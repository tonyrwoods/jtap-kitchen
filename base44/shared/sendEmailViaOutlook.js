/**
 * Sends an email via the connected Outlook (Microsoft Graph) account.
 * Uses the builder's authorized Outlook connector (SHARED mode).
 *
 * @param {object} base44 - The base44 client (from createClientFromRequest)
 * @param {object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.body - HTML email body
 * @returns {Promise<{ok: boolean}>}
 */
export async function sendEmailViaOutlook(base44, { to, subject, body }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

  const message = {
    subject,
    body: { contentType: 'HTML', content: body },
    toRecipients: [{ emailAddress: { address: to } }],
  };

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  // Graph sendMail returns 202 Accepted with an empty body.
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Outlook send failed (${response.status}): ${errorText}`);
  }

  return { ok: true };
}