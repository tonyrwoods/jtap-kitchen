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
    const item = await base44.asServiceRole.entities.MenuItem.get('MenuItem', itemId);

    if (!item) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }

    const menuItemPayload = {
      source_id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      cost: item.cost,
      is_active: item.is_active !== false,
    };

    const result = await base44.asServiceRole.functions.invoke('syncMenuItemFromJtapKitchen', {
      app_id: JTAPLEDGER_APP_ID,
      menu_item: menuItemPayload,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Menu item sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});