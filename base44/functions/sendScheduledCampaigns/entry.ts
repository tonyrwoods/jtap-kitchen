import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendCampaignById } from '../../shared/sendCampaignById.js';

// Scheduled job: sends any NewsletterCampaign whose scheduled_at time has
// passed but is still in "Scheduled" status. Runs frequently so campaigns
// fire close to their scheduled time.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    const campaigns = await base44.asServiceRole.entities.NewsletterCampaign.filter({ status: 'Scheduled' });
    const due = campaigns.filter((c) => c.scheduled_at && c.scheduled_at <= now);

    const processed = [];
    for (const c of due) {
      try {
        const result = await sendCampaignById(base44, c.id);
        processed.push({ id: c.id, title: c.title, ...result });
      } catch (err) {
        processed.push({ id: c.id, title: c.title, error: err.message });
      }
    }

    return Response.json({ success: true, processed: processed.length, details: processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});