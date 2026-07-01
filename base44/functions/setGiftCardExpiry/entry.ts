import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const { giftCardId } = await req.json();

    const appSettings = await base44.asServiceRole.entities.AppSettings.list().then(data => data[0]);
    const expiryMonths = appSettings?.gift_card_expiry_months || 12;

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + expiryMonths);

    await base44.asServiceRole.entities.GiftCard.update(giftCardId, {
      expiry_date: expiry.toISOString().split("T")[0],
    });

    return Response.json({ success: true, expiryDate: expiry.toISOString().split("T")[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});