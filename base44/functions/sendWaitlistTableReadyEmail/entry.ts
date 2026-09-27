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

    // Recipient is derived from the Waitlist record — never from the request
    // body — to prevent an open email relay via a request-controlled recipient.
    const { waitlistId } = await req.json();

    if (!waitlistId) {
      return Response.json({ error: 'waitlistId required' }, { status: 400 });
    }

    const waitlist = await base44.entities.Waitlist.get(waitlistId);
    if (!waitlist?.email) {
      return Response.json({ error: 'Waitlist entry has no email on file' }, { status: 400 });
    }

    const guestName = waitlist.guest_name || 'Guest';

    await sendTransactionalEmail(base44, {
      to: waitlist.email,
      subject: "Your Table at JTAP Kitchen is Ready!",
      body: `Hello ${guestName},\n\nYour table at JTAP Kitchen is ready! Please check in with the host within 10 minutes.\n\nThank you!`,
    });

    await base44.asServiceRole.entities.Waitlist.update(waitlistId, { notification_sent: true, notified_at: new Date().toISOString() });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});