import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { postText, eventId } = await req.json();

    if (!postText) {
      return Response.json({ error: 'postText is required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    // Get the authenticated user's LinkedIn profile URN
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!profileRes.ok) {
      const err = await profileRes.text();
      return Response.json({ error: `Failed to get LinkedIn profile: ${err}` }, { status: 500 });
    }

    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Post to LinkedIn as a member post
    const postPayload = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: postText
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postPayload)
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return Response.json({ error: `LinkedIn API error: ${err}` }, { status: 500 });
    }

    const result = await postRes.json();

    // Mark the event as announced if eventId provided
    if (eventId) {
      await base44.asServiceRole.entities.Event.update(eventId, {
        linkedin_posted: true,
        linkedin_post_id: result.id
      });
    }

    return Response.json({ success: true, postId: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});