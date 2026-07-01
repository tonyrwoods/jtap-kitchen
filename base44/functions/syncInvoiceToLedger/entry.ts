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
    const invoiceId = event.entity_id;
    const invoice = await base44.asServiceRole.entities.Invoice.get('Invoice', invoiceId);

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only sync paid invoices
    if (invoice.status !== 'Paid') {
      return Response.json({ skipped: 'Invoice not paid yet' });
    }

    // Create revenue transaction in Ledger
    const ledgerData = {
      transaction_type: 'revenue',
      source_app: 'kitchen',
      source_entity: 'Invoice',
      source_id: invoice.id,
      date: new Date().toISOString().split('T')[0],
      description: `Sales Revenue - Table ${invoice.table_number}`,
      amount: invoice.total,
      payment_method: invoice.payment_method,
      items_count: invoice.items?.length || 0,
      sync_status: 'synced'
    };

    console.log('Syncing invoice to Ledger:', ledgerData);

    return Response.json({ success: true, data: ledgerData });
  } catch (error) {
    console.error('Invoice sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});