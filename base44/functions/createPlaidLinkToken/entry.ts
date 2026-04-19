import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');
    const env = Deno.env.get('PLAID_ENV') || 'sandbox';

    const plaidUrl = `https://${env}.plaid.com/link/token/create`;

    const response = await fetch(plaidUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        client_name: 'JTAP Kitchen',
        user: {
          client_user_id: user.id,
        },
        client_exposed_id: user.id,
        language: 'en',
        country_codes: ['US'],
        products: ['auth'],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error_message || 'Failed to create link token' }, { status: response.status });
    }

    return Response.json({
      link_token: data.link_token,
      expiration: data.expiration,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});