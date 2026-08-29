import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// System-triggered (by the "Auto-Post Promotion to Social" workflow on
// EventPromotion create) — no user session is available, so entity and
// connector access uses the service role.

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${display}:${m} ${ampm}`;
}

function defaultCaptionBody(promo, appUrl) {
  const lines = [promo.title];
  if (promo.subtitle) lines.push(promo.subtitle);
  const when = [formatDate(promo.date), promo.time ? formatTime(promo.time) + (promo.end_time ? '–' + formatTime(promo.end_time) : '') : ''].filter(Boolean).join(' at ');
  if (when) lines.push(`📅 ${when}`);
  if (promo.location_label) lines.push(`📍 ${promo.location_label}`);
  if (promo.price_per_guest > 0) {
    lines.push(`🎟️ $${Number(promo.price_per_guest).toFixed(0)}/guest${promo.default_discount_amount > 0 ? ` (loyalty members save $${Number(promo.default_discount_amount).toFixed(0)})` : ''}`);
  } else {
    lines.push('🎟️ Complimentary admission');
  }
  if (promo.description) lines.push(promo.description.slice(0, 220));
  if (promo.rsvp_deadline) lines.push(`RSVP by ${formatDate(promo.rsvp_deadline)}`);
  if (promo.share_slug) lines.push(`\nReserve your spot: ${appUrl}/event-announce/${promo.share_slug}`);
  return lines.join('\n');
}

function applyTemplate(template, promo, appUrl) {
  const link = promo.share_slug ? `${appUrl}/event-announce/${promo.share_slug}` : '';
  const vals = {
    title: promo.title || '',
    subtitle: promo.subtitle || '',
    description: (promo.description || '').slice(0, 220),
    date: formatDate(promo.date),
    time: promo.time ? formatTime(promo.time) : '',
    endtime: promo.end_time ? formatTime(promo.end_time) : '',
    location: promo.location_label || '',
    price: promo.price_per_guest > 0 ? `$${Number(promo.price_per_guest).toFixed(0)}/guest` : 'Complimentary',
    discount: promo.default_discount_amount > 0 ? `$${Number(promo.default_discount_amount).toFixed(0)} off` : '',
    rsvp_deadline: formatDate(promo.rsvp_deadline),
    link,
  };
  let out = template;
  for (const [k, v] of Object.entries(vals)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

function hashtagString(str) {
  if (!str) return '';
  return str.split(',').map((s) => s.trim()).filter(Boolean).map((t) => '#' + t.replace(/^#/, '')).join(' ');
}

async function postToInstagram(accessToken, imageUrl, caption) {
  const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
  const me = await meRes.json();
  if (!me.id) throw new Error(`Instagram auth failed: ${JSON.stringify(me.error || me)}`);
  const igId = me.id;

  const containerRes = await fetch(`https://graph.instagram.com/v25.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const container = await containerRes.json();
  if (!container.id) throw new Error(`Instagram media container failed: ${JSON.stringify(container.error || container)}`);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const stRes = await fetch(`https://graph.instagram.com/v25.0/${container.id}?fields=status_code&access_token=${accessToken}`);
    const st = await stRes.json();
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') throw new Error('Instagram media processing failed');
    if (i === 19) throw new Error('Instagram media processing timed out');
  }

  const pubRes = await fetch(`https://graph.instagram.com/v25.0/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
  });
  const pub = await pubRes.json();
  if (!pub.id) throw new Error(`Instagram publish failed: ${JSON.stringify(pub.error || pub)}`);
  return pub.id;
}

async function postToFacebook(userAccessToken, imageUrl, message) {
  const accRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`);
  const acc = await accRes.json();
  const page = acc.data && acc.data[0];
  if (!page) throw new Error('No Facebook Pages are managed by this account');
  const pageToken = page.access_token;

  let postRes;
  if (imageUrl) {
    postRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, caption: message, access_token: pageToken }),
    });
  } else {
    postRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: pageToken }),
    });
  }
  const post = await postRes.json();
  if (post.error) throw new Error(`Facebook post failed: ${post.error.message || JSON.stringify(post.error)}`);
  return post.id || post.post_id;
}

// JTAP Kitchen Company Page — https://www.linkedin.com/company/143568250
// The connected account must be an admin of this organization; the
// w_organization_social scope on the token authorizes posting on its behalf.
const JTAP_LINKEDIN_COMPANY_URN = 'urn:li:organization:143568250';

async function postToLinkedIn(accessToken, text) {
  const authorUrn = JTAP_LINKEDIN_COMPANY_URN;
  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  const result = await postRes.json();
  if (!postRes.ok || !result.id) throw new Error(`LinkedIn post failed: ${JSON.stringify(result)}`);
  return result.id;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { promotion_id, platforms: payloadPlatforms } = body;
    if (!promotion_id) return Response.json({ error: 'promotion_id is required' }, { status: 400 });

    const promos = await base44.asServiceRole.entities.EventPromotion.filter({ id: promotion_id });
    const promo = promos[0];
    if (!promo) return Response.json({ error: 'Promotion not found' }, { status: 404 });
    if (promo.is_active === false) return Response.json({ skipped: true, reason: 'inactive promotion' });

    const settingsRows = await base44.asServiceRole.entities.AppSettings.list();
    const s = (settingsRows && settingsRows[0]) || {};
    const platforms = (Array.isArray(payloadPlatforms) && payloadPlatforms.length)
      ? payloadPlatforms
      : (s.social_default_platforms || ['instagram', 'facebook']);
    const hashtags = s.social_hashtags || 'jtapkitchen, memphis';
    const template = s.social_caption_template || '';
    const appUrl = secrets.get('APP_URL') || 'https://jtapkitchen.base44.app';

    const captionBody = template ? applyTemplate(template, promo, appUrl) : defaultCaptionBody(promo, appUrl);
    const tags = hashtagString(hashtags);
    const caption = tags ? `${captionBody}\n\n${tags}` : captionBody;

    const results = {};

    if (platforms.includes('instagram')) {
      try {
        if (!promo.banner_image_url) throw new Error('Promotion has no banner image (Instagram requires one)');
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');
        const postId = await postToInstagram(accessToken, promo.banner_image_url, caption);
        results.instagram = { success: true, post_id: postId };
      } catch (e) {
        console.error('Instagram post error:', e.message);
        results.instagram = { success: false, error: e.message };
      }
    }

    if (platforms.includes('facebook')) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
        const postId = await postToFacebook(accessToken, promo.banner_image_url, caption);
        results.facebook = { success: true, post_id: postId };
      } catch (e) {
        console.error('Facebook post error:', e.message);
        results.facebook = { success: false, error: e.message };
      }
    }

    if (platforms.includes('linkedin')) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');
        const postId = await postToLinkedIn(accessToken, caption);
        results.linkedin = { success: true, post_id: postId };
      } catch (e) {
        console.error('LinkedIn post error:', e.message);
        results.linkedin = { success: false, error: e.message };
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('postPromotionToSocial error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}