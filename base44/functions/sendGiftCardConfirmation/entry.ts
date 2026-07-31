import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const event = body.event || {};

    if (event.type !== 'create') return Response.json({ skipped: true });

    // Fetch the real gift card record from the DB — never trust the request body
    // (prevents arbitrary recipient / content injection via direct HTTP calls)
    if (!event.entity_id) return Response.json({ error: 'Missing entity_id' }, { status: 400 });
    const giftCard = await base44.asServiceRole.entities.GiftCard.get(event.entity_id);
    if (!giftCard) return Response.json({ error: 'Gift card not found' }, { status: 404 });
    if (!giftCard.purchaser_email || !giftCard.code) {
      return Response.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const amountFormatted = Number(giftCard.amount || 0).toFixed(2);
    const isForRecipient = giftCard.recipient_email && giftCard.recipient_name;

    // Email to purchaser
    const purchaserBody = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: linear-gradient(135deg, #C89B4F 0%, #A67C3F 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px;">🎁 Gift Card Purchase Confirmed</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 20px; font-size: 16px;">
            Hi <strong>${giftCard.purchaser_name}</strong>,
          </p>
          
          <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666;">
            Thank you for purchasing a gift card! ${isForRecipient ? `We'll be sending a separate email to ${giftCard.recipient_name} with the code and your personal message.` : 'Keep this confirmation for your records.'}
          </p>

          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px; font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Gift Card Details</h2>
            
            <div style="margin-bottom: 12px;">
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Amount</p>
              <p style="margin: 0; font-size: 28px; font-weight: bold; color: #C89B4F;">$${amountFormatted}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Code</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">${giftCard.code}</p>
            </div>

            <div>
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Status</p>
              <p style="margin: 0; font-size: 14px;">
                <span style="display: inline-block; background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">
                  ${giftCard.status || 'Pending Payment'}
                </span>
              </p>
            </div>
          </div>

          <div style="background: #fffbf0; border-left: 4px solid #C89B4F; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #666;">
              <strong>💡 How to Redeem:</strong> Present this code at checkout, or mention it to our staff. The gift card can be used for any dining experience at JTAP Kitchen.
            </p>
          </div>

          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
            Gift cards never expire and can be transferred to anyone. Thank you for supporting JTAP Kitchen!
          </p>

          <p style="margin: 20px 0 0; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            © JTAP Kitchen. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await sendEmailViaGmail(base44, {
      to: giftCard.purchaser_email,
      subject: 'Gift Card Purchase Confirmed',
      body: purchaserBody,
      from_name: 'JTAP Kitchen'
    });

    // Email to recipient if specified
    if (isForRecipient) {
      const recipientBody = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #C89B4F 0%, #A67C3F 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 24px;">🎁 You've Received a Gift Card!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 40px 20px; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 20px; font-size: 16px;">
              Hi <strong>${giftCard.recipient_name}</strong>,
            </p>
            
            ${giftCard.message ? `
              <div style="background: white; border-left: 4px solid #C89B4F; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold;">From ${giftCard.purchaser_name}:</p>
                <p style="margin: 0; font-size: 14px; font-style: italic; line-height: 1.6;">"${giftCard.message}"</p>
              </div>
            ` : ''}

            <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666;">
              You've been gifted a <strong>$${amountFormatted} gift card</strong> to JTAP Kitchen! Start planning your visit and bring this code.
            </p>

            <div style="background: #fff3cd; border: 2px dashed #C89B4F; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #856404; text-transform: uppercase; font-weight: bold;">Your Gift Card Code</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #C89B4F;">${giftCard.code}</p>
            </div>

            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px; font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px;">How to Redeem</h2>
              <ol style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 8px;">Visit JTAP Kitchen in person</li>
                <li style="margin-bottom: 8px;">Show this code to our staff at checkout</li>
                <li>Your $${amountFormatted} will be deducted from your bill</li>
              </ol>
            </div>

            <div style="background: #fffbf0; border-left: 4px solid #C89B4F; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #666;">
                <strong>💡 No expiration!</strong> Your gift card never expires and can be used anytime. Can't make it? Feel free to transfer the code to a friend.
              </p>
            </div>

            <p style="margin: 20px 0 0; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
              © JTAP Kitchen. All rights reserved.
            </p>
          </div>
        </div>
      `;

      await sendEmailViaGmail(base44, {
        to: giftCard.recipient_email,
        subject: `You've Received a $${amountFormatted} Gift Card to JTAP Kitchen!`,
        body: recipientBody,
        from_name: 'JTAP Kitchen'
      });
    }

    return Response.json({ sent: true, purchaser: giftCard.purchaser_email, recipient: isForRecipient ? giftCard.recipient_email : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});