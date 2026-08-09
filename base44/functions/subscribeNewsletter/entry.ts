import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, source } = body;

    if (!email) {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'subscribeNewsletter', String(email).toLowerCase(), 3, 86400000);
    if (limited) return limited;

    // Force is_active=true — public submitters cannot self-deactivate or spoof source.
    await base44.asServiceRole.entities.Subscriber.create({
      name: (name || '').trim() || null,
      email: String(email).trim(),
      source: source || 'footer',
      is_active: true,
    });

    // Welcome email to the new subscriber (external recipient → Gmail).
    const displayName = (name || '').trim() || 'Valued Guest';
    try {
      await sendTransactionalEmail(base44, {
        to: String(email).trim(),
        subject: 'Welcome to JTAP Kitchen Inner Circle',
        body: `Welcome to the JTAP Kitchen Inner Circle!\n\nThank you for subscribing to our newsletter, ${displayName}!\n\nYou'll now receive:\n• Seasonal menu updates and chef's specials\n• Exclusive event invitations\n• Special offers and promotions\n• Behind-the-scenes stories from our kitchen\n\nWe're excited to have you as part of our community. If you have any questions or preferences, feel free to reply to this email.\n\nBest regards,\nThe JTAP Kitchen Team\n\n---\nTo manage your preferences or unsubscribe, reply to this email.`,
        from_name: 'JTAP Kitchen',
      });
    } catch (_) { /* welcome email is best-effort */ }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}