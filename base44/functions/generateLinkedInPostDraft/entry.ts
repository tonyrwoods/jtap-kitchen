import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Narrow, app-specific AI op: drafts a LinkedIn announcement post for a single
// event. Admin-only. The prompt is built server-side from structured event
// fields (the client never sends free-form prompt text), so this is not a
// generic LLM proxy. Runs InvokeLLM as service role to protect integration
// credits from direct client calls.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { title, date, time, price_per_guest, event_type, description } = await req.json().catch(() => ({}));
    if (!title) return Response.json({ error: 'Event title is required' }, { status: 400 });

    const prompt = `Write a professional, engaging LinkedIn post announcing this fine dining experience at JTAP Kitchen. Keep it under 280 characters, use 1-2 emojis, include relevant hashtags like #FineDining #JTAPKitchen. Event details: Title: "${title}", Date: ${date}, Time: ${time}, Price: $${price_per_guest}/guest, Type: ${event_type}. Description: ${description || ''}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const text = typeof result === 'string' ? result : (result?.text || result?.content || '');
    return Response.json({ text });
  } catch (error) {
    console.error('generateLinkedInPostDraft error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}