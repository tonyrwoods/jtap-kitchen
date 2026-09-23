import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const GRAPH = 'https://graph.facebook.com/v25.0';

async function graphGet(token, path, params) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(`Meta API ${res.status}: ${body?.error?.message || 'request failed'}`);
  return body;
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// Pulls campaign-level performance (last 30 days) for every ad account the
// connected Meta Ads user can access, stores a fresh snapshot in
// MetaAdsInsight (replacing the previous one), and returns a summary.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    if (!accessToken) {
      return Response.json({ error: 'Meta Ads account not connected' }, { status: 400 });
    }

    // Step 1: list ad accounts
    const acctsRes = await graphGet(accessToken, 'me/adaccounts', { fields: 'account_id,name', limit: 100 });
    const accounts = acctsRes.data || [];

    const rows = [];
    for (const acct of accounts) {
      const actId = `act_${acct.account_id}`;

      // Campaign metadata (name, status, objective)
      let campMap = new Map();
      try {
        const campRes = await graphGet(accessToken, `${actId}/campaigns`, {
          fields: 'id,name,status,objective,effective_status',
          limit: 200,
        });
        for (const c of (campRes.data || [])) campMap.set(c.id, c);
      } catch (e) {
        // Non-fatal: continue without campaign status if this edge fails
        console.warn(`campaigns fetch failed for ${actId}: ${e.message}`);
      }

      // Step 2 + 3: campaign-level insights for the last 30 days
      let insights = [];
      try {
        const insRes = await graphGet(accessToken, `${actId}/insights`, {
          fields: 'campaign_id,campaign_name,objective,spend,impressions,clicks,reach,frequency,cpc,cpm,ctr,actions,action_values,purchase_roas',
          level: 'campaign',
          date_preset: 'last_30d',
          limit: 200,
        });
        insights = insRes.data || [];
      } catch (e) {
        console.warn(`insights fetch failed for ${actId}: ${e.message}`);
        continue;
      }

      const now = new Date().toISOString();
      for (const ins of insights) {
        const camp = campMap.get(ins.campaign_id) || {};
        const actions = Array.isArray(ins.actions) ? ins.actions : [];
        const actionValues = Array.isArray(ins.action_values) ? ins.action_values : [];
        const roasArr = Array.isArray(ins.purchase_roas) ? ins.purchase_roas : [];

        const purchaseAction = actions.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase') || actions[0];
        const purchaseValueRow = actionValues.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase') || actionValues[0];
        const results = purchaseAction ? num(purchaseAction.value) : 0;
        const purchaseValue = purchaseValueRow ? num(purchaseValueRow.value) : 0;

        const roasEntry = roasArr.find(r => r.action_type === 'omni_purchase') || roasArr[0];
        const roasFromMeta = roasEntry ? num(roasEntry.value) : 0;
        const spend = num(ins.spend);
        const roas = roasFromMeta || (spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0);

        rows.push({
          account_id: acct.account_id,
          account_name: acct.name || '',
          campaign_id: ins.campaign_id,
          campaign_name: ins.campaign_name || camp.name || '',
          objective: ins.objective || camp.objective || '',
          campaign_status: camp.effective_status || camp.status || '',
          spend: +spend.toFixed(2),
          impressions: Math.round(num(ins.impressions)),
          clicks: Math.round(num(ins.clicks)),
          reach: Math.round(num(ins.reach)),
          frequency: +num(ins.frequency).toFixed(2),
          cpc: +num(ins.cpc).toFixed(2),
          cpm: +num(ins.cpm).toFixed(2),
          ctr: +num(ins.ctr).toFixed(2),
          results,
          purchase_value: +purchaseValue.toFixed(2),
          roas,
          date_start: ins.date_start || '',
          date_stop: ins.date_stop || '',
          synced_at: now,
        });
      }
    }

    // Replace the previous snapshot with the fresh one
    if (rows.length) {
      await base44.asServiceRole.entities.MetaAdsInsight.deleteMany({});
      await base44.asServiceRole.entities.MetaAdsInsight.bulkCreate(rows);
    }

    const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
    return Response.json({
      success: true,
      synced: rows.length,
      accounts: accounts.length,
      total_spend: +totalSpend.toFixed(2),
    });
  } catch (error) {
    console.error('syncMetaAdsInsights error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}