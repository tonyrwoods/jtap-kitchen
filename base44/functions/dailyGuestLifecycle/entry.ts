import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { esc } from '../../shared/escapeHtml.js';

const APP_URL = Deno.env.get('APP_URL') || 'https://jtapkitchen.com';

function todayMdNum(date) {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function mdNum(mmdd) {
  if (!mmdd || typeof mmdd !== 'string') return null;
  const parts = mmdd.split('-');
  if (parts.length < 2) return null;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(d)) return null;
  return m * 100 + d;
}

function birthdayBody(firstName) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{font-family:'Inter',Arial,sans-serif;color:#1c1a17;line-height:1.6;margin:0;padding:0}
  .wrap{max-width:600px;margin:0 auto}
  .header{background:#c48931;padding:28px 36px;text-align:center}
  .header img{width:130px;height:auto}
  .body{background:#fdfcfc;padding:40px 36px;border:1px solid #e5e0dc;border-top:none}
  .h1{font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:700;margin:0 0 6px;color:#1c1a17}
  .sub{color:#78736d;margin:0 0 20px;font-size:15px}
  p{margin:0 0 16px;font-size:15px}
  .cta{display:inline-block;background:#c48931;color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0 20px}
  .fine{color:#78736d;font-size:13px;margin-top:16px}
  .footer{background:#1c1a17;padding:20px 36px;text-align:center;color:#78736d;font-size:12px}
  </style></head><body>
  <div class="wrap">
    <div class="header"><img src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/2f9d59b8a_smJKLOGO_HR.jpg" alt="JTAP Kitchen"></div>
    <div class="body">
      <p class="h1">Happy Birthday, ${esc(firstName)}!</p>
      <p class="sub">We'd love to help you celebrate.</p>
      <p>Everyone at JTAP Kitchen wants to wish you a wonderful birthday. To make your celebration even sweeter, we're treating you to a <strong>complimentary dessert</strong> on your next visit.</p>
      <p>Simply book a table and mention your birthday offer when you arrive. This treat is valid through the end of your birthday month.</p>
      <a href="${APP_URL}/book" class="cta">Book Your Birthday Table</a>
      <p class="fine">We can't wait to celebrate with you. Cheers to another year of great food and great company.</p>
    </div>
    <div class="footer">JTAP Kitchen, Memphis, TN, ${APP_URL}</div>
  </div></body></html>`;
}

function winbackBody(firstName) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{font-family:'Inter',Arial,sans-serif;color:#1c1a17;line-height:1.6;margin:0;padding:0}
  .wrap{max-width:600px;margin:0 auto}
  .header{background:#c48931;padding:28px 36px;text-align:center}
  .header img{width:130px;height:auto}
  .body{background:#fdfcfc;padding:40px 36px;border:1px solid #e5e0dc;border-top:none}
  .h1{font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:700;margin:0 0 6px;color:#1c1a17}
  .sub{color:#78736d;margin:0 0 20px;font-size:15px}
  p{margin:0 0 16px;font-size:15px}
  .cta{display:inline-block;background:#c48931;color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0 20px}
  .fine{color:#78736d;font-size:13px;margin-top:16px}
  .footer{background:#1c1a17;padding:20px 36px;text-align:center;color:#78736d;font-size:12px}
  </style></head><body>
  <div class="wrap">
    <div class="header"><img src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/2f9d59b8a_smJKLOGO_HR.jpg" alt="JTAP Kitchen"></div>
    <div class="body">
      <p class="h1">We miss you, ${esc(firstName)}!</p>
      <p class="sub">It's been a while, and we'd love to welcome you back.</p>
      <p>It's been too long since your last visit to JTAP Kitchen, and we'd like to invite you back with a <strong>complimentary small plate</strong> on your next visit.</p>
      <p>Book a table and let your server know you're claiming your welcome-back treat. We've missed you and can't wait to serve you again.</p>
      <a href="${APP_URL}/book" class="cta">Book a Table</a>
      <p class="fine">This offer is valid for the next 30 days. We look forward to seeing you soon.</p>
    </div>
    <div class="footer">JTAP Kitchen, Memphis, TN, ${APP_URL}</div>
  </div></body></html>`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const results = { profiles_synced: 0, birthday_sent: 0, winback_sent: 0, errors: [] };

    // ── 1. Sync profiles from reservations created in the last 26h ──
    const since = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();
    const recentRes = await base44.asServiceRole.entities.Reservation.filter(
      { created_date: { $gte: since }, status: { $ne: 'Cancelled' } },
      { limit: 100, fields: ['guest_name', 'email', 'phone', 'date'] }
    );

    for (const res of (recentRes.items || [])) {
      if (!res.email) continue;
      try {
        const existing = await base44.asServiceRole.entities.GuestProfile.filter(
          { email: res.email }, { limit: 1, fields: ['id', 'first_visit_date', 'last_visit_date'] }
        );
        const profile = existing.items?.[0];
        const visitDate = res.date || now.toISOString().split('T')[0];

        if (profile) {
          if (!profile.last_visit_date || visitDate > profile.last_visit_date) {
            await base44.asServiceRole.entities.GuestProfile.update(profile.id, {
              full_name: res.guest_name || undefined,
              phone: res.phone || undefined,
              last_visit_date: visitDate,
              first_visit_date: profile.first_visit_date || visitDate,
            });
          }
        } else {
          await base44.asServiceRole.entities.GuestProfile.create({
            email: res.email,
            full_name: res.guest_name || '',
            phone: res.phone || '',
            last_visit_date: visitDate,
            first_visit_date: visitDate,
            marketing_opt_in: true,
          });
        }
        results.profiles_synced++;
      } catch (e) {
        results.errors.push(`Sync ${res.email}: ${e.message}`);
      }
    }

    // ── 2. Birthday offers — birthday MM-DD in next 7 days, not sent this year ──
    const todayMD = todayMdNum(now);
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const futureMD = todayMdNum(futureDate);
    const wraps = futureMD < todayMD;

    const allProfiles = await base44.asServiceRole.entities.GuestProfile.filter(
      { marketing_opt_in: { $ne: false } },
      { limit: 500, fields: ['id', 'email', 'full_name', 'birthday', 'last_birthday_offer_year'] }
    );

    for (const p of (allProfiles.items || [])) {
      const bdayMD = mdNum(p.birthday);
      if (!bdayMD || p.last_birthday_offer_year === currentYear) continue;

      const inWindow = wraps
        ? (bdayMD >= todayMD || bdayMD <= futureMD)
        : (bdayMD >= todayMD && bdayMD <= futureMD);
      if (!inWindow) continue;

      try {
        const firstName = (p.full_name || 'there').split(' ')[0];
        await sendTransactionalEmail(base44, {
          to: p.email,
          subject: `Happy Birthday, ${firstName}! A gift from JTAP Kitchen`,
          body: birthdayBody(firstName),
          from_name: 'JTAP Kitchen',
        });
        await base44.asServiceRole.entities.GuestProfile.update(p.id, {
          last_birthday_offer_year: currentYear,
        });
        results.birthday_sent++;
      } catch (e) {
        results.errors.push(`Birthday ${p.email}: ${e.message}`);
      }
    }

    // ── 3. Win-back — last visit > 90 days ago, not sent in 30 days ──
    const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cutoff30 = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();

    const lapsed = await base44.asServiceRole.entities.GuestProfile.filter(
      { last_visit_date: { $lte: cutoff90 }, marketing_opt_in: { $ne: false } },
      { limit: 200, fields: ['id', 'email', 'full_name', 'last_visit_date', 'last_winback_date'] }
    );

    for (const p of (lapsed.items || [])) {
      if (!p.last_visit_date) continue;
      if (p.last_winback_date && new Date(p.last_winback_date) > new Date(cutoff30)) continue;

      try {
        const firstName = (p.full_name || 'there').split(' ')[0];
        await sendTransactionalEmail(base44, {
          to: p.email,
          subject: `We miss you, ${firstName}! Come back to JTAP Kitchen`,
          body: winbackBody(firstName),
          from_name: 'JTAP Kitchen',
        });
        await base44.asServiceRole.entities.GuestProfile.update(p.id, {
          last_winback_date: now.toISOString(),
        });
        results.winback_sent++;
      } catch (e) {
        results.errors.push(`Winback ${p.email}: ${e.message}`);
      }
    }

    return Response.json({ status: 'success', ...results });
  } catch (error) {
    console.error('Error in dailyGuestLifecycle:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}