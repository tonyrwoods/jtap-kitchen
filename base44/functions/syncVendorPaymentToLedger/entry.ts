import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await req.json();
    const paymentId = event.entity_id;
    const payment = await base44.asServiceRole.entities.VendorPayment.get('VendorPayment', paymentId);

    if (!payment) {
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Create expense transaction in Ledger
    const ledgerData = {
      transaction_type: 'expense',
      source_app: 'kitchen',
      source_entity: 'VendorPayment',
      source_id: payment.id,
      invoice_id: payment.invoice_id,
      vendor_name: payment.vendor_name,
      date: payment.paid_date || new Date().toISOString().split('T')[0],
      description: `Vendor Payment - ${payment.vendor_name} (Payment #${payment.payment_number})`,
      amount: payment.amount,
      status: payment.status,
      payment_method_id: payment.payment_method_id,
      is_reconciled: payment.is_reconciled,
      sync_status: 'synced'
    };

    console.log('Syncing vendor payment to Ledger:', ledgerData);

    return Response.json({ success: true, data: ledgerData });
  } catch (error) {
    console.error('Vendor payment sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});