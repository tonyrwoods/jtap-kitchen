import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';
import { esc } from '../../shared/escapeHtml.js';

const APP_URL = Deno.env.get('APP_URL') || 'https://jtapkitchen.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, guest_name } = await req.json();
    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const firstName = (guest_name || 'there').split(' ')[0];
    const surveyLink = `${APP_URL}/guest-feedback?email=${encodeURIComponent(email)}&name=${encodeURIComponent(guest_name || '')}`;

    const body = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{font-family:'Inter',Arial,sans-serif;color:#1c1a17;line-height:1.6;margin:0;padding:0}
  .wrap{max-width:600px;margin:0 auto}
  .header{background:#c48931;padding:28px 36px;text-align:center}
  .header img{width:130px;height:auto}
  .body{background:#fdfcfc;padding:40px 36px;border:1px solid #e5e0dc;border-top:none}
  .h1{font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;margin:0 0 6px;color:#1c1a17}
  .sub{color:#78736d;margin:0 0 20px;font-size:15px}
  p{margin:0 0 16px;font-size:15px}
  .scale{display:flex;justify-content:space-between;margin:24px 0 8px}
  .scale span{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:1px solid #e5e0dc;font-size:13px;font-weight:600;color:#78736d}
  .scale-labels{display:flex;justify-content:space-between;color:#78736d;font-size:12px;margin-bottom:20px}
  .cta{display:inline-block;background:#c48931;color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0 20px}
  .fine{color:#78736d;font-size:13px;margin-top:16px}
  .footer{background:#1c1a17;padding:20px 36px;text-align:center;color:#78736d;font-size:12px}
  </style></head><body>
  <div class="wrap">
    <div class="header"><img src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/2f9d59b8a_smJKLOGO_HR.jpg" alt="JTAP Kitchen"></div>
    <div class="body">
      <p class="h1">How was your visit, ${esc(firstName)}?</p>
      <p class="sub">Your honest feedback takes 2 minutes and helps us improve.</p>
      <p>We'd love to hear about your recent experience at JTAP Kitchen. Your feedback stays private and goes directly to our team, so we can keep improving.</p>
      <p style="text-align:center;font-weight:600">On a scale of 0 to 10, how likely are you to recommend us?</p>
      <div class="scale">${Array.from({length:11},(_,i)=>`<span>${i}</span>`).join('')}</div>
      <div class="scale-labels"><span>Not likely</span><span>Very likely</span></div>
      <div style="text-align:center">
        <a href="${surveyLink}" class="cta">Take the 2-Minute Survey</a>
      </div>
      <p class="fine">Thank you for helping us serve you better. We appreciate your time.</p>
    </div>
    <div class="footer">JTAP Kitchen, Memphis, TN, ${APP_URL}</div>
  </div></body></html>`;

    await sendTransactionalEmail(base44, {
      to: email,
      subject: `How was your visit to JTAP Kitchen, ${firstName}?`,
      body,
      from_name: 'JTAP Kitchen',
    });

    return Response.json({ status: 'success', message: `NPS survey sent to ${email}` });
  } catch (error) {
    console.error('Error in sendNpsSurvey:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}