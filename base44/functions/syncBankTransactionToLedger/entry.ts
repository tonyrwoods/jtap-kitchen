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
    const transactionId = event.entity_id;
    const transaction = await base44.asServiceRole.entities.BankTransaction.get('BankTransaction', transactionId);

    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const ledgerData = {
      source_app: 'kitchen',
      source_entity: 'BankTransaction',
      source_id: transaction.id,
      date: transaction.transaction_date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.transaction_type,
      account: transaction.payment_method_label,
      reference_number: transaction.reference_number,
      matched_to: transaction.matched_to,
      matched_id: transaction.matched_id,
      reconciliation_status: transaction.reconciliation_status,
      sync_status: 'synced'
    };

    console.log('Syncing bank transaction to Ledger:', ledgerData);

    return Response.json({ success: true, data: ledgerData });
  } catch (error) {
    console.error('Bank transaction sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});