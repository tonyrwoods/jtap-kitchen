import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { giftCard } = await req.json();

    if (!giftCard || !giftCard.code || !giftCard.amount) {
      return Response.json({ error: 'Missing required gift card data' }, { status: 400 });
    }

    // Determine recipient email
    const recipientEmail = giftCard.recipient_email || giftCard.purchaser_email;
    const recipientName = giftCard.recipient_name || 'Valued Guest';

    // Build email body
    const emailBody = `
Dear ${recipientName},

You've been gifted a $${giftCard.amount} JTAP Kitchen gift card!

Your Voucher Code: ${giftCard.code}

${giftCard.message ? `\nPersonal Message:\n"${giftCard.message}"\n` : ''}

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
    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Your $${giftCard.amount} JTAP Kitchen Gift Card`,
      body: emailBody,
      from_name: 'JTAP Kitchen'
    });

    // Update gift card delivery status
    await base44.entities.GiftCard.update(giftCard.id, {
      delivery_status: 'sent',
      delivered_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});