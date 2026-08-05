import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { sendCampaignById } from '../../shared/sendCampaignById.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { campaignId } = body;
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const result = await sendCampaignById(base44, campaignId);
    if (result.error) return Response.json({ error: result.error }, { status: 404 });

    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});