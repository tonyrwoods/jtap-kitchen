import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    // Support both direct {name, email} and automation {event, data} formats
    const email = body.email || body.data?.email;
    const name = body.name || body.data?.name;

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const emailBody = `
Welcome to the JTAP Kitchen Inner Circle!

Thank you for subscribing to our newsletter, ${name || 'Valued Guest'}!

You'll now receive:
• Seasonal menu updates and chef's specials
• Exclusive event invitations
• Special offers and promotions
• Behind-the-scenes stories from our kitchen

We're excited to have you as part of our community. If you have any questions or preferences, feel free to reply to this email.

Best regards,
The JTAP Kitchen Team

---
To manage your preferences or unsubscribe, reply to this email.
    `;

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Welcome to JTAP Kitchen Inner Circle',
      body: emailBody,
      from_name: 'JTAP Kitchen'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});