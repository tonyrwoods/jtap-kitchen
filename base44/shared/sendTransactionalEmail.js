import { sendEmailViaOutlook } from './sendEmailViaOutlook.js';
import { sendEmailViaGmail } from './sendEmailViaGmail.js';

/**
 * Sends a transactional email with provider resilience.
 *
 * Primary path: the platform's built-in SendEmail integration, which sends
 * from the app's verified custom domain (info@jtapkitchen.com) with proper
 * SPF/DKIM/DMARC alignment. This is what strict receivers (iCloud, etc.)
 * accept — consumer webmail From: addresses get rejected by their inbound
 * policy. Requires a connected custom domain on a paid plan.
 *
 * Fallback: the builder's connected Outlook account, then Gmail, so a
 * single-provider outage never silently drops a message.
 *
 * @param {object} base44 - The base44 client (from createClientFromRequest)
 * @param {object} opts - { to, subject, body, from_name? }
 * @returns {Promise<{ok: boolean, provider?: string, fallbackReason?: string}>}
 * @throws {Error} when SendEmail and both connectors fail
 */
export async function sendTransactionalEmail(base44, { to, subject, body, from_name } = {}) {
  // 1) Primary — domain-verified platform SendEmail.
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      body,
      from_name: from_name || 'JTAP Kitchen',
    });
    return { ok: true, provider: 'sendemail' };
  } catch (primaryErr) {
    // 2) Fallback — builder's Outlook connector.
    try {
      await sendEmailViaOutlook(base44, { to, subject, body });
      return { ok: true, provider: 'outlook', fallbackReason: primaryErr.message };
    } catch (outlookErr) {
      // 3) Last resort — builder's Gmail connector.
      try {
        await sendEmailViaGmail(base44, { to, subject, body });
        return { ok: true, provider: 'gmail', fallbackReason: `SendEmail: ${primaryErr.message} | Outlook: ${outlookErr.message}` };
      } catch (gmailErr) {
        throw new Error(`SendEmail: ${primaryErr.message} | Outlook: ${outlookErr.message} | Gmail: ${gmailErr.message}`);
      }
    }
  }
}