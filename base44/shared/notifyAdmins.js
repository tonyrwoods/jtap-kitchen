/**
 * Sends an operational alert email to all admin users.
 * Uses the platform's built-in SendEmail integration (not the Gmail/Outlook
 * connectors) so alerts still go out when an email connector itself is the
 * thing that broke. Best-effort: never throws.
 *
 * @param {object} base44 - The base44 client (from createClientFromRequest)
 * @param {object} opts
 * @param {string} opts.subject - Alert subject line
 * @param {string} opts.body - HTML body of the alert
 */
export async function notifyAdmins(base44, { subject, body }) {
  try {
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const a of admins) {
      if (!a.email) continue;
      await base44.integrations.Core.SendEmail({
        to: a.email,
        subject,
        body,
        from_name: 'JTAP Kitchen Alerts',
      }).catch(() => {});
    }
  } catch (_) {
    // never let alerting itself throw
  }
}