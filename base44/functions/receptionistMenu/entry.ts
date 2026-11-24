import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeReceptionist, unauthorized } from '../../shared/receptionistAuth.js';
import { SITE_CATEGORIES } from '../../shared/menuCategories.js';

// AI receptionist tool: the live menu plus the restaurant's contact details.
// Read-only, and only the fields a guest would be told over the phone.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await authorizeReceptionist(req, base44))) return unauthorized();

    const [menuPage, settingsList] = await Promise.all([
      base44.asServiceRole.entities.MenuItem.filter(
        { category: { $in: SITE_CATEGORIES } },
        { limit: 500, sort: 'category' },
      ),
      base44.asServiceRole.entities.AppSettings.list(),
    ]);

    const settings = settingsList[0] || {};
    const items = (menuPage?.items || menuPage || []).map((item) => ({
      name: item.name,
      category: item.category,
      description: item.description || '',
      price: item.price ?? null,
      dietary_tags: item.dietary_tags || [],
      featured: item.is_featured === true,
    }));

    return Response.json({
      restaurant: {
        name: settings.restaurant_name || 'JTAP Kitchen',
        phone: settings.contact_phone || '',
        email: settings.contact_email || '',
        address: settings.address || '',
      },
      item_count: items.length,
      items,
    });
  } catch (error) {
    console.error('receptionistMenu error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}