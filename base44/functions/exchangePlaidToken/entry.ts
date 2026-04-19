import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicToken } = await req.json();

    if (!publicToken) {
      return Response.json({ error: 'Missing publicToken' }, { status: 400 });
    }

    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');
    const env = Deno.env.get('PLAID_ENV') || 'sandbox';

    const plaidUrl = `https://${env}.plaid.com/item/public_token/exchange`;

    // Exchange public token for access token
    const response = await fetch(plaidUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        public_token: publicToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error_message || 'Failed to exchange token' }, { status: response.status });
    }

    const { access_token, item_id } = data;

    // Get account info
    const accountUrl = `https://${env}.plaid.com/auth/get`;
    const accountResponse = await fetch(accountUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: access_token,
      }),
    });

    const accountData = await accountResponse.json();

    if (!accountResponse.ok) {
      return Response.json({ error: 'Failed to retrieve account info' }, { status: accountResponse.status });
    }

    // Store linked account
    const accounts = accountData.accounts || [];
    if (accounts.length > 0) {
      const account = accounts[0];
      await base44.entities.LinkedBankAccount.create({
        user_email: user.email,
        plaid_item_id: item_id,
        plaid_access_token: access_token,
        bank_name: accountData.item?.institution_id || 'Unknown',
        account_name: account.name,
        account_number: account.mask,
        account_type: account.type,
        subtype: account.subtype,
        is_active: true,
      });
    }

    return Response.json({
      success: true,
      message: 'Bank account linked successfully',
      accounts: accounts.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});