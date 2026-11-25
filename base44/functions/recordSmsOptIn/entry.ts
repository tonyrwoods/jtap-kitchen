import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { enforceRateLimit } from '../../shared/rateLimit.js';

// Records an explicit SMS opt-in submitted from the public text-message opt-in
// page. Public by design (a consumer opting in has no account), but it only
// writes a consent record — it never sends a message and never touches any
// existing guest, reservation or waitlist record.

const CONSENT_TEXT = 'I agree to receive SMS/text messages from JTAP Kitchen at the mobile phone number entered above about reservation confirmations, reminders, table-ready alerts, and updates. Up to 4 messages per reservation and up to 2 messages per waitlist visit. Msg & data rates may apply. Reply STOP to cancel, HELP for help. Consent is optional and is not a condition of purchase.';

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone(body.phone);

    if (!phone) {
      return Response.json({ error: 'A valid 10-digit mobile phone number is required.' }, { status: 400 });
    }
    if (body.sms_opt_in !== true) {
      return Response.json({ error: 'Please check the box to agree to receive text messages.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'recordSmsOptIn', phone, 5, 3600000);
    if (limited) return limited;

    await base44.asServiceRole.entities.SmsConsent.create({
      phone,
      consent_text: CONSENT_TEXT,
      source: 'sms-opt-in page',
      page_url: '/sms-opt-in',
      consented_at: new Date().toISOString(),
    });

    return Response.json({ success: true, phone });
  } catch (error) {
    console.error('recordSmsOptIn failed:', error.message);
    return Response.json({ error: 'Could not record your opt-in. Please try again.' }, { status: 500 });
  }
}