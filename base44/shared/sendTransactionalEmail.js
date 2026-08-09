import { sendEmailViaOutlook } from './sendEmailViaOutlook.js';
import { sendEmailViaGmail } from './sendEmailViaGmail.js';

/**
 * Sends a transactional email with provider resilience.
 * Tries Outlook (builder's connected account) first; on failure, falls back
 * to Gmail so a single-provider outage never silently drops a message.
 *
 * @param {object} base44 - The base44 client (from createClientFromRequest)
 * @param {object} opts - { to, subject, body }
 * @returns {Promise<{ok: boolean, provider?: string, fallbackReason?: string}>}
 * @throws {Error} when both Outlook and Gmail fail (mirrors sendEmailViaGmail's throw-on-failure semantics)
 */
export async function sendTransactionalEmail(base44, { to, subject, body }) {
  try {
    await sendEmailViaOutlook(base44, { to, subject, body });
    return { ok: true, provider: 'outlook' };
  } catch (outlookErr) {
    try {
      await sendEmailViaGmail(base44, { to, subject, body });
      return { ok: true, provider: 'gmail', fallbackReason: outlookErr.message };
    } catch (gmailErr) {
      throw new Error(`Outlook: ${outlookErr.message} | Gmail fallback: ${gmailErr.message}`);
    }
  }
}