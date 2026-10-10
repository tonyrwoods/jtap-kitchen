import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Ads Optimization Agent — autonomous agent that analyzes Meta Ads performance
// (MetaAdsInsight) against recent reservation activity and produces budget-shift
// recommendations saved as AdsRecommendation records for admin review. Runs
// weekly via the scheduled workflow. Narrow app op: the prompt is built
// server-side from structured entity data; the model returns structured JSON.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const insights = await base44.asServiceRole.entities.MetaAdsInsight.list('-created_date', 50);
  if (!insights || insights.length === 0) {
    return Response.json({ generated: 0, reason: 'no Meta Ads insights synced' });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentRes = await base44.asServiceRole.entities.Reservation.filter({ created_date: { $gte: since } }).catch(() => []);

  const totalSpend = insights.reduce((s, i) => s + (Number(i.spend) || 0), 0);
  const totalResults = insights.reduce((s, i) => s + (Number(i.results) || 0), 0);
  const totalPurchaseValue = insights.reduce((s, i) => s + (Number(i.purchase_value) || 0), 0);
  const resCount = recentRes.length;

  const campaignSummary = insights.map((i) => {
    const roas = Number(i.roas) || 0;
    const cpc = Number(i.cpc) || 0;
    const ctr = Number(i.ctr) || 0;
    return `Campaign: ${i.campaign_name || '(unnamed)'} | Status: ${i.campaign_status || 'unknown'} | Objective: ${i.objective || 'n/a'} | Spend 30d: $${(Number(i.spend) || 0).toFixed(2)} | Impressions: ${i.impressions || 0} | Clicks: ${i.clicks || 0} | CTR: ${ctr.toFixed(2)}% | CPC: $${cpc.toFixed(2)} | Results: ${i.results || 0} | Purchase Value: $${(Number(i.purchase_value) || 0).toFixed(2)} | ROAS: ${roas.toFixed(2)}`;
  }).join('\n');

  const prompt = `You are a paid-media strategist for JTAP Kitchen, a fine-dining small-plates restaurant in Memphis, TN. Goal: maximize reservations and event RSVPs per ad dollar.

Last 30-day Meta Ads performance by campaign:
${campaignSummary}

Account totals — Spend: $${totalSpend.toFixed(2)} | Results: ${totalResults} | Purchase Value: $${totalPurchaseValue.toFixed(2)} | Account ROAS: ${totalSpend ? (totalPurchaseValue / totalSpend).toFixed(2) : '0.00'}.
Reservation activity (last 7 days): ${resCount} new reservations created.

For EACH campaign, produce a recommendation object. Use the metrics to decide: Scale Up (strong ROAS/CTR, low frequency), Hold (steady), Optimize (high spend but weak CTR/ROAS — fix creative or targeting), or Pause (no results, high spend, or fatigued frequency >4). Be specific and reference the numbers. Also include one final object with campaign_name "Account Summary" giving an overall budget reallocation recommendation.

Return ONLY a JSON object matching the schema — no prose.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              campaign_name: { type: 'string' },
              priority: { type: 'string' },
              recommendation: { type: 'string' },
              suggested_action: { type: 'string' },
            },
          },
        },
      },
      required: ['recommendations'],
    },
  });

  const recs = result && typeof result === 'object' && Array.isArray(result.recommendations) ? result.recommendations : [];

  let generated = 0;
  const errors = [];
  for (const rec of recs) {
    if (!rec || !rec.campaign_name || !rec.recommendation) continue;
    try {
      const insight = insights.find((i) => (i.campaign_name || '').toLowerCase().includes(String(rec.campaign_name).toLowerCase())) || null;
      await base44.asServiceRole.entities.AdsRecommendation.create({
        campaign_name: rec.campaign_name,
        account_name: insight?.account_name || insights[0]?.account_name || '',
        current_spend: insight ? Number(insight.spend) || 0 : 0,
        recommendation: rec.recommendation,
        suggested_action: ['Scale Up', 'Hold', 'Optimize', 'Pause'].includes(rec.suggested_action) ? rec.suggested_action : 'Hold',
        priority: ['High', 'Medium', 'Low'].includes(rec.priority) ? rec.priority : 'Medium',
        status: 'New',
        generated_at: new Date().toISOString(),
      });
      generated++;
    } catch (err) {
      errors.push({ campaign: rec.campaign_name, error: err.message });
    }
  }

  return Response.json({ generated, campaignsAnalyzed: insights.length, reservationsLast7d: resCount, errors });
});