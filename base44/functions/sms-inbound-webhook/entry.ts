import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { secrets } from 'base44:runtime';
import { sendSms } from '../../shared/sendSms.js';

// Twilio inbound SMS keyword handling. When a guest replies to a JTAP Kitchen
// text, Twilio POSTs the message here. We record STOP/UNSTOP opt-outs (so the
// outbound sendSms helper skips opted-out numbers) and reply to HELP with
// program info. Also accepts JSON so it can be exercised from the function tester.
//
// Configure Twilio's messaging webhook (Phone Number or Messaging Service >
// "A MESSAGE COMES IN" > Webhook) to:
//   https://jtapkitchen.base44.app/functions/sms-inbound-webhook

const OPT_OUT = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'optout', 'opt out'];
const OPT_IN = ['start', 'unstop', 'yes', 'optin', 'opt in', 'resume', 'sub'];
const HELP = ['help', 'info', 'more'];

function normalizePhone(p) {
  return '+' + String(p == null ? '' : p).replace(/[^\d]/g, '');
}

async function sendHelpReply(phone) {
  const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
  const authToken = secrets.get('TWILIO_AUTH_TOKEN');
  const fromNumber = secrets.get('TWILIO_FROM_NUMBER');
  if (!accountSid || !authToken || !fromNumber) return;
  try {
    await sendSms({
      to: phone,
      body: 'JTAP Kitchen SMS: Reservation & waitlist alerts. Message & data rates may apply. Reply STOP to opt out, START to resume. Questions? Call 901-233-4060 or email info@jtapkitchen.com.',
      accountSid, authToken, fromNumber,
    });
  } catch (smsErr) {
    console.error('HELP reply SMS failed:', smsErr.message);
  }
}

export default async function (req) {
  const base44 = createClientFromRequest(req);

  let from, body;
  const ct = req.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const j = await req.json();
      from = j.From || j.from;
      body = j.Body || j.body;
    } else {
      const form = await req.formData();
      from = form.get('From');
      body = form.get('Body');
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
    } else if (action === 'opt_in') {
      const patch = { ...common, status: 'OptedIn', opted_in_at: now };
      if (record) await base44.asServiceRole.entities.SmsOptOut.update(record.id, patch);
      else await base44.asServiceRole.entities.SmsOptOut.create({ phone, ...patch });
    } else if (action === 'help') {
      if (record) await base44.asServiceRole.entities.SmsOptOut.update(record.id, common);
      await sendHelpReply(phone);
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