import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

// Public gift card purchase endpoint. The GiftCard entity's create RLS is
// admin-only, which blocks the old client-side base44.entities.GiftCard.create
// call for every non-admin buyer (the purchase flow was 403'ing). This creates
// the record with the service role, forces status to "Pending Payment", and
// generates the code server-side. The sendGiftCardConfirmation entity
// automation fires on create and emails the purchaser (and recipient) — no
// email is sent here, avoiding the duplicate email the old direct
// sendGiftCardEmail call produced.
function generateCode() {
  return 'JTAP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default async function (req) {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const body = await req.json();
    const { purchaser_name, purchaser_email, recipient_name, recipient_email, message, amount } = body;
    const amt = parseFloat(amount);

    if (!purchaser_name || !purchaser_email || !amt || amt < 10) {
      return Response.json({ error: 'Name, email, and an amount of at least $10 are required.' }, { status: 400 });
    }
    if (amt > 2000) {
      return Response.json({ error: 'Gift card amount cannot exceed $2000.' }, { status: 400 });
    }

    const rl = await enforceRateLimit(req, base44, 'gift-card-purchase', String(purchaser_email).toLowerCase(), 3, 3600000);
    if (rl) return rl;

    const code = generateCode();
    const card = await base44.asServiceRole.entities.GiftCard.create({
      purchaser_name: String(purchaser_name).slice(0, 120),
      purchaser_email: String(purchaser_email).trim().toLowerCase(),
      recipient_name: recipient_name ? String(recipient_name).slice(0, 120) : null,
      recipient_email: recipient_email ? String(recipient_email).trim().toLowerCase() : null,
      message: message ? String(message).slice(0, 1000) : null,
      amount: amt,
      code,
      status: 'Pending Payment',
    });

    return Response.json({ success: true, code, amount: amt, id: card.id });
  } catch (error) {
    if (base44) {
      await notifyAdmins(base44, {
        subject: 'Gift card purchase failed',
        body: `The submitGiftCardPurchase function threw an error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}