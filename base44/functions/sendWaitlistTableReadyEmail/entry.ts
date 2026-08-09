import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'staff') {
      return Response.json({ error: 'Forbidden — admin or staff only' }, { status: 403 });
    }

    const { waitlistId, guestName, guestEmail } = await req.json();

    if (!guestEmail) {
      return Response.json({ error: "Email required" }, { status: 400 });
    }

    await sendTransactionalEmail(base44, {
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