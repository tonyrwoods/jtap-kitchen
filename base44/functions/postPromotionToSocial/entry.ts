import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

function buildCaption(promo, appUrl) {
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
  lines.push('\n#jtapkitchen #memphis');
  return lines.join('\n');
}

async function postToInstagram(accessToken, imageUrl, caption) {
  // 1. Resolve the IG Business account ID
  const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
  const me = await meRes.json();
  if (!me.id) throw new Error(`Instagram auth failed: ${JSON.stringify(me.error || me)}`);
  const igId = me.id;

  // 2. Create a media container
  const containerRes = await fetch(`https://graph.instagram.com/v25.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const container = await containerRes.json();
  if (!container.id) throw new Error(`Instagram media container failed: ${JSON.stringify(container.error || container)}`);

  // 3. Wait for processing to finish
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const stRes = await fetch(`https://graph.instagram.com/v25.0/${container.id}?fields=status_code&access_token=${accessToken}`);
    const st = await stRes.json();
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') throw new Error('Instagram media processing failed');
    if (i === 19) throw new Error('Instagram media processing timed out');
  }

  // 4. Publish the container
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
  // 1. List managed pages and grab a Page access token
  const accRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`);
  const acc = await accRes.json();
  const page = acc.data && acc.data[0];
  if (!page) throw new Error('No Facebook Pages are managed by this account');
  const pageToken = page.access_token;

  // 2. Publish — photo post if we have a banner, otherwise a text/feed post
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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { promotion_id, platforms } = body;
    if (!promotion_id || !Array.isArray(platforms) || platforms.length === 0) {
      return Response.json({ error: 'promotion_id and platforms are required' }, { status: 400 });
    }

    const promos = await base44.asServiceRole.entities.EventPromotion.filter({ id: promotion_id });
    const promo = promos[0];
    if (!promo) return Response.json({ error: 'Promotion not found' }, { status: 404 });

    const appUrl = process.env.APP_URL || 'https://jtapkitchen.base44.app';
    const caption = buildCaption(promo, appUrl);
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

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('postPromotionToSocial error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}