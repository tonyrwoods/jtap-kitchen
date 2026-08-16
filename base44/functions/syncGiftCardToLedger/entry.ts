import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JTAPLEDGER_APP_ID = Deno.env.get('JTAPLEDGER_APP_ID');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { event } = await req.json();
    const giftCardId = event.entity_id;
    const giftCard = await base44.asServiceRole.entities.GiftCard.get('GiftCard', giftCardId);

    if (!giftCard) {
      return Response.json({ error: 'Gift card not found' }, { status: 404 });
    }

    // Only sync redeemed gift cards
    if (giftCard.status !== 'Redeemed') {
      return Response.json({ skipped: 'Gift card not redeemed yet' });
    }

    const giftCardPayload = {
      source_id: giftCard.id,
      code: giftCard.code,
      amount: giftCard.amount,
      date: giftCard.redeemed_at || new Date().toISOString(),
      purchaser_name: giftCard.purchaser_name,
      recipient_name: giftCard.recipient_name,
    };

    const result = await base44.asServiceRole.functions.invoke('syncGiftCardFromJtapKitchen', {
      app_id: JTAPLEDGER_APP_ID,
      gift_card: giftCardPayload,
      event_type: event.type,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Gift card sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
