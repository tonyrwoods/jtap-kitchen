import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GRAPH_BASE = 'https://graph.instagram.com';
const SYNC_LIMIT = 12;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // 1. Resolve the connected Instagram Business account id + username
    const meRes = await fetch(
      `${GRAPH_BASE}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!meRes.ok) {
      const detail = await meRes.text();
      return Response.json({ error: 'Failed to resolve Instagram account', detail }, { status: 502 });
    }
    const me = await meRes.json();
    const igUserId = me.id;

    // 2. Fetch the latest media (images + carousels only — videos have no usable image_url for the feed)
    const mediaRes = await fetch(
      `${GRAPH_BASE}/${igUserId}/media?fields=id,caption,media_url,permalink,timestamp,media_type&limit=${SYNC_LIMIT}&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!mediaRes.ok) {
      const detail = await mediaRes.text();
      return Response.json({ error: 'Failed to fetch Instagram media', detail }, { status: 502 });
    }
    const mediaJson = await mediaRes.json();
    const mediaItems = (mediaJson.data || []).filter(
      (m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM'
    );

    if (mediaItems.length === 0) {
      return Response.json({ success: true, synced: 0, message: 'No image posts found on Instagram.' });
    }

    // 3. Find existing synced records to upsert (avoid duplicates by instagram_media_id)
    const mediaIds = mediaItems.map((m) => m.id);
    const existing = await base44.asServiceRole.entities.InstagramPost.filter({
      is_synced: true,
      instagram_media_id: { $in: mediaIds }
    });

    const existingByMediaId = new Map(existing.map((p) => [p.instagram_media_id, p]));

    const toCreate = [];
    const toUpdate = [];

    for (const item of mediaItems) {
      const ts = item.timestamp ? Date.parse(item.timestamp) : Date.now();
      // Newest posts get the most negative sort_order so they surface first (ascending sort)
      const sortOrder = -ts;
      const payload = {
        image_url: item.media_url,
        caption: item.caption || '',
        sort_order: sortOrder,
        is_active: true,
        instagram_media_id: item.id,
        permalink: item.permalink || '',
        is_synced: true
      };
      const match = existingByMediaId.get(item.id);
      if (match) {
        toUpdate.push({ id: match.id, ...payload });
      } else {
        toCreate.push(payload);
      }
    }

    let created = 0;
    let updated = 0;
    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.InstagramPost.bulkCreate(toCreate);
      created = toCreate.length;
    }
    if (toUpdate.length > 0) {
      await base44.asServiceRole.entities.InstagramPost.bulkUpdate(toUpdate);
      updated = toUpdate.length;
    }

    return Response.json({
      success: true,
      synced: created + updated,
      created,
      updated,
      username: me.username
    });
  } catch (error) {
    console.error('syncInstagramPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}