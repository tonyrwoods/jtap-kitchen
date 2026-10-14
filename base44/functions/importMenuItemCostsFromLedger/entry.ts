import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const LEDGER_URL = 'https://jtapledger.base44.app/functions/getMenuItemCosts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // 1. Pull costs from the JTAP Ledger
    const apiKey = secrets.get('JTAP_KITCHEN_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'JTAP_KITCHEN_API_KEY secret is not set' }, { status: 500 });
    }

    const ledgerRes = await fetch(LEDGER_URL, {
      headers: { 'x-jtap-api-key': apiKey },
      signal: AbortSignal.timeout(15000),
    });
    if (!ledgerRes.ok) {
      const errText = await ledgerRes.text();
      console.error('Ledger fetch failed:', ledgerRes.status, errText);
      return Response.json(
        { error: `Ledger request failed (${ledgerRes.status})` },
        { status: 502 }
      );
    }
    const ledgerBody = await ledgerRes.json();
    const ledgerItems: any[] = ledgerBody.items || [];

    // 2. Build a name → cost map (only items with a real non-zero cost)
    const costMap = new Map<string, number>();
    for (const li of ledgerItems) {
      if (li.ingredient_cost > 0) {
        costMap.set(String(li.name).toLowerCase().trim(), Number(li.ingredient_cost));
      }
    }

    // 3. Fetch all Kitchen menu items (paginate if needed)
    const allKitchenItems: any[] = [];
    let cursor: string | undefined;
    do {
      const page = await base44.entities.MenuItem.list({ limit: 500, cursor });
      const items = page.items || page;
      allKitchenItems.push(...items);
      cursor = page.next_cursor;
    } while (cursor);

    // 4. Match by name and prepare bulk updates
    const updates: { id: string; cost: number }[] = [];
    const unmatched: string[] = [];
    for (const item of allKitchenItems) {
      const key = String(item.name || '').toLowerCase().trim();
      if (costMap.has(key)) {
        updates.push({ id: item.id, cost: costMap.get(key)! });
      } else if (item.cost === null || item.cost === undefined) {
        unmatched.push(item.name);
      }
    }

    // 5. Bulk update matched items
    if (updates.length > 0) {
      await base44.entities.MenuItem.bulkUpdate(updates);
    }

    return Response.json({
      success: true,
      ledgerItems: ledgerItems.length,
      ledgerItemsWithCost: costMap.size,
      kitchenItems: allKitchenItems.length,
      updated: updates.length,
      unmatched: unmatched.length,
      unmatchedNames: unmatched.slice(0, 20),
    });
  } catch (error) {
    console.error('Import menu item costs error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}