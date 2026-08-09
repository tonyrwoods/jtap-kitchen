import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      contact_name, email, phone, preferred_date, preferred_day,
      guest_count, event_type, package: pkg,
    } = body;

    if (!contact_name || !email || !preferred_day) {
      return Response.json({ error: 'Name, email, and preferred day are required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'submitEventWaitlist', String(email).toLowerCase(), 3, 3600000);
    if (limited) return limited;

    // Force server-controlled fields — public submitters cannot self-set status/notified_at.
    const entry = await base44.asServiceRole.entities.EventWaitlist.create({
      contact_name,
      email,
      phone: phone || null,
      preferred_date: preferred_date || null,
      preferred_day,
      guest_count: parseInt(guest_count) || 0,
      event_type: event_type || null,
      package: pkg || 'Not Sure',
      status: 'Waiting',
    });

    // Confirmation email to the submitter (external recipient → Gmail).
    try {
      await sendEmailViaGmail(base44, {
        to: email,
        subject: "You're on the Waitlist — JTAP Kitchen Event Center",
        body: `Hi ${contact_name},\n\nYou've been added to the JTAP Kitchen Event Center waitlist!\n\nWe'll notify you immediately if a spot opens up for ${preferred_date || preferred_day}. You'll have first priority to book before anyone else.\n\nIf you have questions in the meantime, reach us at events@jtapkitchen.com or (555) 012-3456.\n\n— The JTAP Kitchen Events Team`,
      });
    } catch (_) { /* confirmation is best-effort */ }

    return Response.json({ success: true, entry });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}