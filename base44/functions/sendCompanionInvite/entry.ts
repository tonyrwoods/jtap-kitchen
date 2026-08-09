import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendEmailViaOutlook } from '../../shared/sendEmailViaOutlook.js';

const escapeHtml = (text) => String(text == null ? '' : text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Invite-style templates. Each provides a subject line and an intro sentence
// (HTML-safe holder name is passed in).
const TEMPLATES = {
  general: {
    subject: (h) => `${h} invited you to dinner at JTAP Kitchen`,
    intro: (h) => `<strong>${h}</strong> has invited you to join their table at JTAP Kitchen.`,
  },
  casual: {
    subject: () => `You're invited! Dinner at JTAP Kitchen`,
    intro: (h) => `Hey! <strong>${h}</strong> would love for you to join them for dinner at JTAP Kitchen.`,
  },
  birthday: {
    subject: () => `Birthday dinner invitation — JTAP Kitchen`,
    intro: (h) => `<strong>${h}</strong> is celebrating a birthday and would love for you to join them at JTAP Kitchen!`,
  },
  corporate: {
    subject: (h) => `Dinner invitation from ${h} — JTAP Kitchen`,
    intro: (h) => `<strong>${h}</strong> has reserved a table at JTAP Kitchen and would like to invite you to join.`,
  },
  anniversary: {
    subject: () => `Anniversary dinner — JTAP Kitchen`,
    intro: (h) => `<strong>${h}</strong> is celebrating an anniversary and would love for you to join them at JTAP Kitchen.`,
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { reservation_token, name, email, contacts, template } = await req.json();
    if (!reservation_token) {
      return Response.json({ error: 'reservation_token required' }, { status: 400 });
    }

    // Resolve a list of { name, email } contacts from either a single name+email
    // or a bulk contacts array.
    let list = [];
    if (Array.isArray(contacts) && contacts.length) {
      list = contacts
        .map((c) => ({
          name: String(c.name || '').trim(),
          email: String(c.email || '').trim().toLowerCase(),
        }))
        .filter((c) => c.email);
    } else if (name && email) {
      list = [{ name: String(name).trim(), email: String(email).trim().toLowerCase() }];
    }
    if (list.length === 0) {
      return Response.json({ error: 'Provide either name+email or a contacts array' }, { status: 400 });
    }

    const reservations = await base44.asServiceRole.entities.Reservation.filter({ confirm_token: reservation_token });
    const reservation = reservations[0];
    if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });
    if (reservation.status !== 'Confirmed' && reservation.status !== 'Pending') {
      return Response.json({ error: 'Reservation must be active (Pending or Confirmed) before inviting companions' }, { status: 400 });
    }

    // Don't allow invites for reservations whose date has already passed
    const todayStr = new Date().toISOString().split('T')[0];
    if (reservation.date && reservation.date < todayStr) {
      return Response.json({ error: 'This reservation date has passed and can no longer accept companion invites.' }, { status: 400 });
    }

    const maxCompanions = Math.max(0, (reservation.party_size || 1) - 1);
    const existingInvites = await base44.asServiceRole.entities.ReservationInvite.filter({ reservation_id: reservation.id });
    const activeCount = existingInvites.filter((i) => i.rsvp_status !== 'Declined').length;

    // Dedupe against existing invites and within the batch, and enforce capacity
    const existingEmails = new Set(existingInvites.map((i) => (i.guest_email || '').toLowerCase()));
    const seen = new Set();
    const toInvite = [];
    const skipped = [];
    for (const c of list) {
      if (existingEmails.has(c.email)) {
        skipped.push({ ...c, reason: 'already invited' });
        continue;
      }
      if (seen.has(c.email)) {
        skipped.push({ ...c, reason: 'duplicate' });
        continue;
      }
      if (activeCount + toInvite.length >= maxCompanions) {
        skipped.push({ ...c, reason: 'capacity reached' });
        continue;
      }
      seen.add(c.email);
      toInvite.push(c);
    }

    if (toInvite.length === 0) {
      return Response.json({ error: 'No new companions to invite', skipped }, { status: 400 });
    }

    const tplKey = TEMPLATES[template] ? template : 'general';
    const tpl = TEMPLATES[tplKey];
    const origin = req.headers.get('origin') || 'https://jtapkitchen.com';
    const dateStr = reservation.date
      ? new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    const safeHolder = escapeHtml(reservation.guest_name);

    const sent = [];
    for (const c of toInvite) {
      const token = crypto.randomUUID();
      await base44.asServiceRole.entities.ReservationInvite.create({
        reservation_id: reservation.id,
        guest_name: c.name,
        guest_email: c.email,
        invite_token: token,
        rsvp_status: 'Pending',
        invite_sent_at: new Date().toISOString(),
      });
      const rsvpUrl = `${origin}/reserve/${token}`;
      await sendEmailViaOutlook(base44, {
        to: c.email,
        subject: tpl.subject(safeHolder),
        body: buildEmail(tpl, safeHolder, escapeHtml(c.name), dateStr, reservation, rsvpUrl),
        from_name: 'JTAP Kitchen',
      }).catch(() => {});
      sent.push(c);
    }

    return Response.json({ success: true, sent, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildEmail(tpl, holder, safeName, dateStr, reservation, rsvpUrl) {
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">You're Invited</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${safeName},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">${tpl.intro(holder)}</p>
      <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>When:</strong> ${dateStr} at ${reservation.time}</p>
        <p style="margin:0;font-size:14px;"><strong>Party of:</strong> ${reservation.party_size}</p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${rsvpUrl}" style="display:inline-block;background:#C89B4F;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;">RSVP Now &rarr;</a>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com</p>
    </div>
  </div>
</body></html>`;
}