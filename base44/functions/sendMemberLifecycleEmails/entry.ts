import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function firstName(name) {
  return esc((String(name || 'there').trim().split(/\s+/)[0]) || 'there');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildBirthdayEmail(m) {
  const first = firstName(m.guest_name);
  return `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
      <p style="color: #999; font-size: 13px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">Happy Birthday</p>
    </div>
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 22px; margin: 0 0 12px;">Happy Birthday, ${first}! 🎉</h2>
      <p style="color: #555; line-height: 1.7; margin: 0 0 20px;">From all of us at JTAP Kitchen, we hope your special day is filled with great food and even better company. As a thank-you for being part of the Tap Room Society, we'd love to treat you this birthday month.</p>
      <div style="background: #f5f3f0; border-radius: 12px; padding: 20px; margin: 0 0 24px; text-align: center;">
        <p style="margin: 0; font-size: 15px; color: #1a1a1a;"><strong>Visit us during your birthday month</strong> and let your server know — a little something sweet is on us.</p>
      </div>
      <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">Just show this email (or mention it) when you dine with us. We can't wait to celebrate with you.</p>
      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431<br/>
        <a href="https://jtapkitchen.com/my-membership" style="color: #C89B4F;">View your membership</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildRenewalEmail(m) {
  const first = firstName(m.guest_name);
  const renewStr = formatDate(m.fee_renewal_date);
  return `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #faf9f7; padding: 40px 20px; color: #1a1a1a; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0d5;">
    <div style="background: #1a1a1a; padding: 32px; text-align: center;">
      <h1 style="color: #C89B4F; font-size: 28px; margin: 0; letter-spacing: 1px;">JTAP Kitchen</h1>
      <p style="color: #999; font-size: 13px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">Membership Renewal</p>
    </div>
    <div style="padding: 40px 36px;">
      <h2 style="font-size: 22px; margin: 0 0 12px;">Your Membership Renews Soon, ${first}</h2>
      <p style="color: #555; line-height: 1.7; margin: 0 0 20px;">This is a friendly reminder that your annual Tap Room Society membership${m.tier ? ' (' + esc(m.tier) + ')' : ''} is set to renew on <strong>${renewStr}</strong>.</p>
      <div style="background: #f5f3f0; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="margin: 0; font-size: 14px; color: #1a1a1a;">To keep your benefits — loyalty points, member events, and more — please make sure your renewal is taken care of before the renewal date.</p>
      </div>
      <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">Questions about your renewal? Reply to this email or give us a call — we're happy to help.</p>
      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431<br/>
        <a href="https://jtapkitchen.com/my-membership" style="color: #C89B4F;">View your membership</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const now = new Date();
    const chicagoNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const currentMonth = chicagoNow.getMonth() + 1;
    const currentDay = chicagoNow.getDate();
    const currentYear = chicagoNow.getFullYear();
    const todayMid = new Date(chicagoNow);
    todayMid.setHours(0, 0, 0, 0);

    const members = await base44.asServiceRole.entities.TapRoomMember.filter({}, '-created_date', 500);
    let birthdays = 0, renewals = 0, errors = 0;

    for (const m of members) {
      if (!m.email) continue;
      const active = m.status !== 'Inactive' && m.status !== 'Suspended';

      // Birthday greeting — exact day match, once per calendar year
      if (active && m.birthday_month === currentMonth && m.birthday_day === currentDay && m.last_birthday_email_year !== currentYear) {
        try {
          await sendTransactionalEmail(base44, {
            to: m.email,
            subject: `Happy Birthday from JTAP Kitchen, ${(String(m.guest_name || 'there').trim().split(/\s+/)[0]) || 'there'}! 🎉`,
            body: buildBirthdayEmail(m),
          });
          await base44.asServiceRole.entities.TapRoomMember.update(m.id, { last_birthday_email_year: currentYear });
          birthdays++;
        } catch {
          errors++;
        }
      }

      // Annual fee renewal reminder — within 14 days, once per renewal date
      if (active && m.tier_earned_or_paid === 'Paid Annual Fee' && m.fee_renewal_date && m.renewal_reminder_for_date !== m.fee_renewal_date) {
        const renewDate = new Date(m.fee_renewal_date + 'T00:00:00');
        const diffDays = Math.round((renewDate.getTime() - todayMid.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays <= 14) {
          try {
            await sendTransactionalEmail(base44, {
              to: m.email,
              subject: `Your Tap Room membership renews ${formatDate(m.fee_renewal_date)}`,
              body: buildRenewalEmail(m),
            });
            await base44.asServiceRole.entities.TapRoomMember.update(m.id, { renewal_reminder_for_date: m.fee_renewal_date });
            renewals++;
          } catch {
            errors++;
          }
        }
      }
    }

    if (errors > 0) {
      await notifyAdmins(base44, {
        subject: `Member lifecycle emails: ${errors} failed`,
        body: `The daily member lifecycle job hit ${errors} email error(s).<br><br>Birthdays sent: ${birthdays}<br>Renewals sent: ${renewals}<br>Members processed: ${members.length}`,
      }).catch(() => {});
    }
    return Response.json({ success: true, birthdays, renewals, errors, processed: members.length });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Member lifecycle job crashed',
      body: `The daily member lifecycle job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
}