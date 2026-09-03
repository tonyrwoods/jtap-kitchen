/**
 * Sends an SMS via the Twilio REST API.
 *
 * Credentials are passed in (read by the calling backend function from app
 * secrets) so this shared module stays runtime-agnostic and reusable from
 * any function (reservation confirmations, reminders, waitlist, events, …).
 *
 * @param {object} opts
 * @param {string} opts.to - Destination phone number in E.164 format (e.g. "+1901xxxxxxx")
 * @param {string} opts.body - Message text (max 1600 chars)
 * @param {string} opts.accountSid - Twilio Account SID
 * @param {string} opts.authToken - Twilio Auth Token
 * @param {string} opts.fromNumber - Twilio sender number in E.164
 * @returns {Promise<object>} Twilio message resource (contains `sid`, `status`)
 */
export async function sendSms({ to, body, accountSid, authToken, fromNumber, base44 }) {
  if (!to || !body || !accountSid || !authToken || !fromNumber) {
    throw new Error('sendSms: missing required parameter');
  }

  // Normalize to E.164-ish (strip spaces/dashes/parens), keep leading +
  const cleanTo = '+' + to.replace(/[^\d]/g, '');

  // Honor STOP opt-outs recorded from inbound replies (Privacy Policy: "reply STOP to opt out").
  // Best-effort: a DB hiccup never blocks a transactional text. When a base44
  // client is supplied, the recipient is checked against the SmsOptOut table.
  if (base44) {
    try {
      const records = await base44.asServiceRole.entities.SmsOptOut.filter({ phone: cleanTo });
      if (records && records.length > 0 && records[0].status === 'OptedOut') {
        console.log(`sendSms: skipping opted-out recipient ${cleanTo}`);
        return { sid: null, status: 'opted_out', opted_out: true };
      }
    } catch (e) {
      console.error('sendSms: opt-out check failed, sending anyway:', e.message);
    }
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: fromNumber, To: cleanTo, Body: body }).toString(),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Twilio SMS failed (${res.status}): ${data.message || JSON.stringify(data)}`);
  }
  return data;
}