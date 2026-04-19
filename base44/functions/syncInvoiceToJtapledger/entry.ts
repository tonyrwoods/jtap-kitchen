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

    // Push invoice to jtapledger
    const invoicePayload = {
      receipt_number: data.receipt_number,
      table_number: data.table_number,
      server_name: data.server_name,
      items: data.items,
      subtotal: data.subtotal,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      discount_amount: data.discount_amount,
      tax_rate: data.tax_rate,
      tax_amount: data.tax_amount,
      total: data.total,
      status: data.status,
      payment_method: data.payment_method,
      external_id: data.id,
      synced_from: 'jtap_kitchen',
      synced_at: new Date().toISOString(),
    };

    // Call jtapledger app to create/update invoice
    const result = await base44.asServiceRole.functions.invoke('syncInvoiceFromJtapKitchen', {
      app_id: JTAPLEDGER_APP_ID,
      invoice: invoicePayload,
      event_type: event.type,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});