import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Auto-logged by the "Log Changelog on Publish" workflow each time the app
// is published from the builder. Creates a ChangelogEntry with source=Auto.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const occurred_at = body.occurred_at || new Date().toISOString();
    const visibility = body.visibility || 'unknown';
    const is_first_publish = body.is_first_publish === true;
    const dateStr = occurred_at.split('T')[0];

    const title = is_first_publish
      ? 'App launched (first publish)'
      : 'App published — new version live';

    await base44.asServiceRole.entities.ChangelogEntry.create({
      title,
      category: 'Feature',
      area: 'Infrastructure',
      source: 'Auto',
      summary: `Published ${visibility} on ${dateStr}.`,
      details:
        'Auto-logged by the "Log Changelog on Publish" workflow each time the app is published from the builder. Add a descriptive manual entry for the specific changes included in this release.',
      entry_date: dateStr,
      is_published: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('logChangelogOnPublish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}