import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JTAPLEDGER_APP_ID = Deno.env.get('JTAPLEDGER_APP_ID');

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

    const inventoryPayload = {
      source_id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.current_stock,
      cost_per_unit: item.cost_per_unit,
      min_stock_level: item.min_stock_level,
      supplier: item.supplier,
      expiry_date: item.expiry_date,
    };

    const result = await base44.asServiceRole.functions.invoke('syncInventoryItemFromJtapKitchen', {
      app_id: JTAPLEDGER_APP_ID,
      inventory_item: inventoryPayload,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Inventory sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});