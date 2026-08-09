import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns the builder's Outlook contacts (name + email) so admins can pick
// recipients when sending Reservation RSVP companion invites. Admin-only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/contacts?$select=displayName,emailAddresses&$top=200&$orderby=displayName',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Outlook contacts request failed (${res.status}): ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const contacts = (data.value || [])
      .map((c) => {
        const email = (c.emailAddresses && c.emailAddresses[0] && c.emailAddresses[0].address) || '';
        return { name: c.displayName || '', email: email.toLowerCase() };
      })
      .filter((c) => c.email);

    return Response.json({ contacts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}