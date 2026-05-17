import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { waitlistId, guestName, guestEmail } = await req.json();

    if (!guestEmail) {
      return Response.json({ error: "Email required" }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: guestEmail,
      subject: "Your Table at JTAP Kitchen is Ready!",
      body: `Hello ${guestName},\n\nYour table at JTAP Kitchen is ready! Please check in with the host within 10 minutes.\n\nThank you!`,
    });

    if (waitlistId) {
      await base44.asServiceRole.entities.Waitlist.update(waitlistId, { notification_sent: true });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});