import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let email = url.searchParams.get('email');
    if (!email) {
      const body = await req.json().catch(() => ({}));
      email = body.email;
    }
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
    const norm = email.trim().toLowerCase();

    const existing = await base44.asServiceRole.entities.Newsletter.filter({ email: norm });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.Newsletter.update(existing[0].id, { is_unsubscribed: true });
    } else {
      await base44.asServiceRole.entities.Newsletter.create({ email: norm, is_unsubscribed: true });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});