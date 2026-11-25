import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { secrets } from 'base44:runtime';

// Twilio inbound SMS keyword handling. When a guest replies to a JTAP Kitchen
// text, Twilio POSTs the message here. We record STOP/UNSTOP opt-outs (so the
// outbound sendSms helper skips opted-out numbers) and reply to HELP with
// program info.
//
// SECURITY: Every form-encoded request is verified against the Twilio signature
// (X-Twilio-Signature header, HMAC-SHA1 of the URL + sorted POST params using
// the Twilio auth token). Unsigned or mismatched requests are rejected with 403,
// so a stranger cannot forge opt-outs/opt-ins for arbitrary numbers. The JSON
// path is admin-only (for exercising via the function tester); Twilio itself
// only sends form-encoded payloads.
//
// Configure Twilio's messaging webhook (Phone Number or Messaging Service >
// "A MESSAGE COMES IN" > Webhook) to:
//   https://jtapkitchen.base44.app/functions/sms-inbound-webhook

const OPT_OUT = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'optout', 'opt out'];
const OPT_IN = ['join', 'start', 'unstop', 'yes', 'optin', 'opt in', 'resume', 'sub'];
const HELP = ['help', 'info', 'more'];

function normalizePhone(p) {
  return '+' + String(p == null ? '' : p).replace(/[^\d]/g, '');
}

// Verify the X-Twilio-Signature header for a form-encoded Twilio request.
// Twilio signs: HMAC-SHA1(authToken, url + sortedParams(name+value...)), base64.
async function verifyTwilioSignature(req, params: Record<string, string>): Promise<boolean> {
  const sig = req.headers.get('x-twilio-signature') || req.headers.get('X-Twilio-Signature');
  if (!sig) return false;
  const authToken = secrets.get('TWILIO_AUTH_TOKEN');
  if (!authToken) return false;

  // Reconstruct the URL exactly as Twilio posted it (https + host + path + query).
  const u = new URL(req.url);
  const fullUrl = `https://${u.host}${u.pathname}${u.search}`;

  let data = fullUrl;
  for (const k of Object.keys(params).sort()) data += k + (params[k] ?? '');

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(authToken),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    // Constant-time comparison to avoid timing leaks.
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  } catch (e) {
    console.error('Twilio signature verify failed:', e.message);
    return false;
  }
}

// Carrier-required HELP reply: program name, opt-out instruction and a live
// contact number. Answered as TwiML on the inbound request itself, so the
// reply does not depend on a second outbound API call succeeding.
const HELP_REPLY = 'JTAP Kitchen: reservation & waitlist alerts. Reply STOP to opt out. Call +1 901-213-8085 for help. Msg & data rates may apply.';

// Carrier-required opt-in confirmation, answered as TwiML on the inbound request
// itself. Sent only when a guest texts one of the OPT_IN keywords above.
const OPT_IN_REPLY = 'JTAP Kitchen: You are subscribed to reservation & waitlist texts. Up to 4 msgs per reservation. Msg & data rates may apply. Reply HELP for help, STOP to cancel.';

// Carrier-required unsubscribe confirmation, answered as TwiML. Sent when a guest
// texts one of the OPT_OUT keywords above; the number is suppressed from then on.
const OPT_OUT_REPLY = 'JTAP Kitchen: You have been unsubscribed and will receive no more messages. Reply START to opt back in, or call +1 901-213-8085 for help.';

function twimlReply(message) {
  const escaped = String(message)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } },
  );
}

export default async function (req) {
  const base44 = createClientFromRequest(req);

  let from, body;
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      // JSON is only for admin-driven testing via the function tester; Twilio
      // posts form-encoded. Require an admin session so anonymous callers
      // cannot forge opt-outs/opt-ins through the JSON path.
      let user;
      try { user = await base44.auth.me(); } catch (_) { user = null; }
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const j = await req.json();
      from = j.From || j.from;
      body = j.Body || j.body;
    } else {
      const form = await req.formData();
      from = form.get('From');
      body = form.get('Body');
      // Build the param map Twilio signed (string values only).
      const params: Record<string, string> = {};
      for (const [k, v] of form.entries()) params[k] = v == null ? '' : String(v);
      if (!(await verifyTwilioSignature(req, params))) {
        return Response.json({ error: 'Invalid Twilio signature' }, { status: 403 });
      }
    }
  } catch (_) {
    return Response.json({ error: 'Could not parse inbound message' }, { status: 400 });
  }

  if (!from) return Response.json({ error: 'Missing From' }, { status: 400 });

  const phone = normalizePhone(from);
  const text = String(body || '').trim();
  const keyword = text.toLowerCase();
  const now = new Date().toISOString();

  let action = 'unknown';
  if (OPT_OUT.includes(keyword)) action = 'opt_out';
  else if (OPT_IN.includes(keyword)) action = 'opt_in';
  else if (HELP.includes(keyword)) action = 'help';

  try {
    const existing = await base44.asServiceRole.entities.SmsOptOut.filter({ phone });
    const record = existing && existing[0];
    const common = { last_keyword: keyword, last_message_body: text.slice(0, 160), last_received_at: now };

    if (action === 'opt_out') {
      const patch = { ...common, status: 'OptedOut', opted_out_at: now };
      if (record) await base44.asServiceRole.entities.SmsOptOut.update(record.id, patch);
      else await base44.asServiceRole.entities.SmsOptOut.create({ phone, ...patch });
      return twimlReply(OPT_OUT_REPLY);
    } else if (action === 'opt_in') {
      const patch = { ...common, status: 'OptedIn', opted_in_at: now };
      if (record) await base44.asServiceRole.entities.SmsOptOut.update(record.id, patch);
      else await base44.asServiceRole.entities.SmsOptOut.create({ phone, ...patch });
      return twimlReply(OPT_IN_REPLY);
    } else if (action === 'help') {
      if (record) await base44.asServiceRole.entities.SmsOptOut.update(record.id, common);
      return twimlReply(HELP_REPLY);
    } else {
      // Non-keyword reply — just log it against any existing record.
      if (record) await base44.asServiceRole.entities.SmsOptOut.update(record.id, common);
    }
  } catch (e) {
    console.error('sms-inbound-webhook error:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }

  return Response.json({ action, phone });
}