import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JTAPLEDGER_APP_ID = '69d2f797069bd30cb2a44f2c';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    const transactionPayload = {
      payment_method_id: data.payment_method_id,
      payment_method_label: data.payment_method_label,
      transaction_date: data.transaction_date,
      description: data.description,
      amount: data.amount,
      transaction_type: data.transaction_type,
      reference_number: data.reference_number,
      matched_to: data.matched_to,
      matched_id: data.matched_id,
      matched_label: data.matched_label,
      match_confidence: data.match_confidence,
      reconciliation_status: data.reconciliation_status,
      external_id: data.id,
      synced_from: 'jtap_kitchen',
      synced_at: new Date().toISOString(),
    };

    const result = await base44.asServiceRole.functions.invoke('syncTransactionFromJtapKitchen', {
      app_id: JTAPLEDGER_APP_ID,
      transaction: transactionPayload,
      event_type: event.type,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});