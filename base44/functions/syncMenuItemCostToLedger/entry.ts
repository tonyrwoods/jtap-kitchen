import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await req.json();
    const itemId = event.entity_id;
    const item = await base44.asServiceRole.entities.MenuItem.get('MenuItem', itemId);

    if (!item) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }

    const ledgerData = {
      source_app: 'kitchen',
      source_entity: 'MenuItem',
      source_id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      cost: item.cost,
      gross_margin: item.cost ? ((item.price - item.cost) / item.price * 100).toFixed(2) : null,
      is_featured: item.is_featured,
      dietary_tags: item.dietary_tags,
      sync_status: 'synced'
    };

    console.log('Syncing menu item cost to Ledger:', ledgerData);

    return Response.json({ success: true, data: ledgerData });
  } catch (error) {
    console.error('Menu item sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});