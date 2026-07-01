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
    const itemId = event.entity_id;
    const item = await base44.asServiceRole.entities.InventoryItem.get('InventoryItem', itemId);

    if (!item) {
      return Response.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const ledgerData = {
      source_app: 'kitchen',
      source_entity: 'InventoryItem',
      source_id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.current_stock,
      cost_per_unit: item.cost_per_unit,
      inventory_value: item.current_stock * item.cost_per_unit,
      min_stock_level: item.min_stock_level,
      supplier: item.supplier,
      last_restock_date: item.last_restock_date,
      expiry_date: item.expiry_date,
      sync_status: 'synced'
    };

    console.log('Syncing inventory cost to Ledger:', ledgerData);

    return Response.json({ success: true, data: ledgerData });
  } catch (error) {
    console.error('Inventory sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});