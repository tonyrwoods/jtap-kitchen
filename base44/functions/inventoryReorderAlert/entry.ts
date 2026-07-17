import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all inventory items using service role
    const allItems = await base44.asServiceRole.entities.InventoryItem.list('-created_date', 500);

    // Find items at or below reorder point
    const lowStockItems = allItems.filter(
      (item) => item.current_stock <= item.min_stock_level
    );

    if (lowStockItems.length === 0) {
      return Response.json({ success: true, message: 'All inventory levels are healthy.', lowStockCount: 0 });
    }

    // Fetch admin users to notify
    const admins = await base44.asServiceRole.entities.User.list('-created_date', 50);
    const adminEmails = admins
      .filter((u) => u.role === 'admin')
      .map((u) => u.email)
      .filter(Boolean);

    if (adminEmails.length === 0) {
      return Response.json({ success: true, message: 'Low stock items found but no admin emails on file.', lowStockCount: lowStockItems.length });
    }

    // Build email body
    const itemList = lowStockItems
      .map((item) => {
        const status = item.current_stock === 0 ? 'OUT OF STOCK' : `${item.current_stock} ${item.unit || ''} (min: ${item.min_stock_level})`;
        return `• ${item.name} — ${status}${item.supplier ? ` | Supplier: ${item.supplier}` : ''}`;
      })
      .join('\n');

    const emailBody = `JTAP Kitchen Inventory Reorder Alert\n\n${lowStockItems.length} item(s) need attention:\n\n${itemList}\n\nPlease review and place reorders as needed.\n\n— JTAP Kitchen System`;

    // Send to each admin
    const sendResults = await Promise.allSettled(
      adminEmails.map((email) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `⚠️ Inventory Reorder Alert — ${lowStockItems.length} item(s) low`,
          body: emailBody,
        })
      )
    );

    const sentCount = sendResults.filter((r) => r.status === 'fulfilled').length;

    return Response.json({
      success: true,
      lowStockCount: lowStockItems.length,
      adminsNotified: sentCount,
      totalAdmins: adminEmails.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});