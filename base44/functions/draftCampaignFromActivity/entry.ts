import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Campaign Auto-Drafter — autonomous agent that generates a weekly newsletter
// draft from recent activity (upcoming events/promotions + featured dishes) and
// saves it as a Draft NewsletterCampaign for admin review in Email Marketing.
// It does NOT send any email — the admin reviews and clicks "Send Now". Runs
// weekly via the scheduled workflow. Narrow app op: the prompt is built
// server-side from structured entity data.

const DEFAULT_BODY = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1a1a1a;padding:32px;text-align:center;">
    <h1 style="color:#c89b4f;font-size:26px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
  </div>
  <div style="padding:40px 32px;background:#faf9f7;">
    <h2 style="font-size:22px;">Hello friends,</h2>
    <p style="color:#666;line-height:1.7;">We've got a great week ahead at JTAP Kitchen. Check out what's coming up and reserve your table — we'd love to host you.</p>
    <p style="color:#666;line-height:1.7;">With gratitude,<br/>The JTAP Kitchen Team</p>
  </div>
  <div style="padding:24px 32px;background:#1a1a1a;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0;">© ${new Date().getFullYear()} JTAP Kitchen · Memphis, TN · info@jtapkitchen.com</p>
  </div>
</div>`;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only: scheduled runs execute as the workflow owner (admin).
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const promotions = await base44.asServiceRole.entities.EventPromotion.list('-date', 20);
  const upcoming = promotions.filter((p) => p.is_active && p.date && p.date >= todayStr).slice(0, 4);

  const menuItems = await base44.asServiceRole.entities.MenuItem.list('-created_date', 50);
  const featured = menuItems.filter((m) => m.is_featured).slice(0, 4);

  if (upcoming.length === 0 && featured.length === 0) {
    return Response.json({ drafted: 0, reason: 'no upcoming events or featured dishes to feature this week' });
  }

  const eventsBlock = upcoming.map((p) =>
    `- ${p.title}${p.date ? ` on ${p.date}` : ''}${p.time ? ` at ${p.time}` : ''}${p.price_per_guest ? ` ($${p.price_per_guest}/guest)` : ''}${p.description ? ` — ${p.description.slice(0, 160)}` : ''}`
  ).join('\n');
  const dishesBlock = featured.map((m) =>
    `- ${m.name} — $${Number(m.price || 0).toFixed(2)}${m.description ? `: ${m.description.slice(0, 120)}` : ''}`
  ).join('\n');

  const prompt = `You are the marketing assistant for JTAP Kitchen, a refined small-plates restaurant in Memphis, TN with a Tap Room Society loyalty program. Write a weekly newsletter to subscribers.

Upcoming events/promotions:
${eventsBlock || '(none this week)'}

Featured dishes:
${dishesBlock || '(none this week)'}

Write:
1. An email subject line (under 70 characters), warm and inviting.
2. The email body as HTML, using this EXACT template structure. Keep the header and footer/signature intact; replace only the BODY CONTENT area inside the middle div. Address the list as "friends" (no {{name}} placeholder). Be concise, genuine, and specific to the items above — do not invent menu items or events not listed. Include a soft call-to-action to reserve or RSVP. Keep paragraphs short.

Template:
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1a1a1a;padding:32px;text-align:center;">
    <h1 style="color:#c89b4f;font-size:26px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
  </div>
  <div style="padding:40px 32px;background:#faf9f7;">
    <!-- BODY CONTENT HERE -->
  </div>
  <div style="padding:24px 32px;background:#1a1a1a;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0;">© ${now.getFullYear()} JTAP Kitchen · Memphis, TN · info@jtapkitchen.com</p>
  </div>
</div>

Return ONLY the subject line on the first line, then a blank line, then the full HTML body. Nothing else.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
  const text = (typeof result === 'string' ? result : (result?.text || result?.content || '')).toString().trim();
  const lines = text.split('\n');
  const subject = (lines[0] || '').trim() || 'This week at JTAP Kitchen';
  const body = lines.slice(2).join('\n').trim() || DEFAULT_BODY;

  const title = `Weekly digest — ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  await base44.asServiceRole.entities.NewsletterCampaign.create({
    title,
    subject,
    body,
    segment: 'All Subscribers',
    status: 'Draft',
  });

  return Response.json({ drafted: 1, title, subject });
});