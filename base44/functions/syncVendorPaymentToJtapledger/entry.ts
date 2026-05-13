import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JTAPLEDGER_APP_ID = Deno.env.get('JTAPLEDGER_APP_ID');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    const paymentPayload = {
      invoice_id: data.invoice_id,
      vendor_name: data.vendor_name,
      payment_number: data.payment_number,
      amount: data.amount,
      due_date: data.due_date,
      paid_date: data.paid_date,
      status: data.status,
      payment_method_id: data.payment_method_id,
      payment_method_label: data.payment_method_label,
      is_reconciled: data.is_reconciled,
      reconciled_date: data.reconciled_date,
      has_discrepancy: data.has_discrepancy,
      discrepancy_amount: data.discrepancy_amount,
      external_id: data.id,
      synced_from: 'jtap_kitchen',
      synced_at: new Date().toISOString(),
    };

    const result = await base44.asServiceRole.functions.invoke('syncPaymentFromJtapKitchen', {
      app_id: JTAPLEDGER_APP_ID,
      payment: paymentPayload,
      event_type: event.type,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});