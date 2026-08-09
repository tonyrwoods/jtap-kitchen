import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendCampaignById } from '../../shared/sendCampaignById.js';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

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

    const failedCampaigns = processed.filter((p) => p.error);
    if (failedCampaigns.length > 0) {
      await notifyAdmins(base44, {
        subject: `Scheduled newsletter campaigns: ${failedCampaigns.length} failed`,
        body: `The scheduled-campaign job had ${failedCampaigns.length} campaign(s) fail to send.<br><br><strong>Failed:</strong><br>${failedCampaigns.map((p) => `${p.title || p.id} — ${p.error}`).join('<br>')}`,
      }).catch(() => {});
    }
    return Response.json({ success: true, processed: processed.length, details: processed });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Scheduled campaign job crashed',
      body: `The scheduled-campaign job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});