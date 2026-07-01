import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const ledgerData = {
      transaction_type: 'revenue',
      source_app: 'kitchen',
      source_entity: 'GiftCard',
      source_id: giftCard.id,
      date: giftCard.redeemed_at || new Date().toISOString().split('T')[0],
      description: `Gift Card Redemption - Code ${giftCard.code}`,
      amount: giftCard.amount,
      purchaser_name: giftCard.purchaser_name,
      recipient_name: giftCard.recipient_name,
      sync_status: 'synced'
    };

    console.log('Syncing gift card to Ledger:', ledgerData);

    return Response.json({ success: true, data: ledgerData });
  } catch (error) {
    console.error('Gift card sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});