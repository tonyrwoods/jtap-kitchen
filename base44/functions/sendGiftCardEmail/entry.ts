import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { giftCard } = await req.json();

    if (!giftCard || !giftCard.id) {
      return Response.json({ error: 'Gift card ID required' }, { status: 400 });
    }

    // Fetch the gift card from the database — do not trust client-supplied payload
    // for authorization checks (RLS scopes the read to the owner/admin).
    const dbCards = await base44.entities.GiftCard.filter({ id: giftCard.id });
    const card = dbCards[0];
    if (!card) {
      return Response.json({ error: 'Gift card not found' }, { status: 404 });
    }

    // Verify the requesting user owns this gift card or is an admin
    const isOwner = card.purchaser_email && card.purchaser_email.toLowerCase() === (user.email || '').toLowerCase();
    if (!isOwner && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — you can only send gift cards you purchased' }, { status: 403 });
    }

    if (!card.code || !card.amount) {
      return Response.json({ error: 'Missing required gift card data' }, { status: 400 });
    }

    // Determine recipient email
    const recipientEmail = card.recipient_email || card.purchaser_email;
    const recipientName = card.recipient_name || 'Valued Guest';

    // Build email body
    const emailBody = `
Dear ${recipientName},

You've been gifted a $${card.amount} JTAP Kitchen gift card!

Your Voucher Code: ${card.code}

${card.message ? `\nPersonal Message:\n"${card.message}"\n` : ''}

How to Redeem:
1. Visit JTAP Kitchen or call (901) 233-4060
2. Mention your voucher code at booking or payment
3. Your gift card balance will be applied to your bill

Gift cards are valid for 12 months from purchase and can be used for dining experiences, events, or gift card balances.

Questions? Contact us at info@jtapkitchen.com or call (901) 233-4060.

Best regards,
JTAP Kitchen Team
    `;

    // Send email via Core.SendEmail integration
    await sendTransactionalEmail(base44, {
      to: recipientEmail,
      subject: `Your $${card.amount} JTAP Kitchen Gift Card`,
      body: emailBody,
      from_name: 'JTAP Kitchen'
    });

    // Update gift card delivery status
    await base44.entities.GiftCard.update(card.id, {
      delivery_status: 'sent',
      delivered_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});