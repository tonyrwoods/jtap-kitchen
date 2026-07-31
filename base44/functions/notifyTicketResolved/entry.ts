import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Escape user-supplied text before interpolating into HTML email
    const escapeHtml = (s) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const body = await req.json().catch(() => ({}));
    const event = body.event || {};

    // Automation path: fetch the real ticket (don't trust attacker-controlled body.data)
    let ticket;
    if (event.type && event.entity_id) {
      ticket = await base44.asServiceRole.entities.SupportTicket.get(event.entity_id);
      if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });
    } else {
      // Manual path: require admin (reject unauthenticated calls)
      let user;
      try { user = await base44.auth.me(); } catch (_) { user = null; }
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      ticket = body.data;
    }

    if (!ticket || !ticket.requester_email) {
      return Response.json({ error: 'Missing ticket data' }, { status: 400 });
    }

    const resolution = ticket.resolution_notes
      ? ticket.resolution_notes
      : 'Our team has resolved your request. Please reach out if you need further assistance.';

    await sendEmailViaGmail(base44, {
      to: ticket.requester_email,
      subject: `Your Support Ticket Has Been Resolved – ${escapeHtml(ticket.subject)}`,
      body: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background-color: #1a1a1a; padding: 32px; text-align: center;">
            <h1 style="color: #c89b4f; font-size: 26px; margin: 0; letter-spacing: 2px;">JTAP Kitchen</h1>
            <p style="color: #888; font-size: 13px; margin: 8px 0 0;">Support Center</p>
          </div>
          <div style="padding: 40px 32px; background-color: #faf9f7;">
            <h2 style="font-size: 20px; color: #1a1a1a; margin-bottom: 8px;">Your ticket has been resolved</h2>
            <p style="color: #666; margin-bottom: 24px;">Hi ${escapeHtml(ticket.requester_name)}, we're happy to let you know that your support request has been resolved.</p>
            <div style="background: #fff; border: 1px solid #e8e2d8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">Subject</p>
              <p style="font-size: 16px; font-weight: 600; margin: 0 0 20px;">${escapeHtml(ticket.subject)}</p>
              <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">Resolution Summary</p>
              <p style="font-size: 14px; color: #444; line-height: 1.6; margin: 0;">${escapeHtml(resolution)}</p>
            </div>
            <p style="color: #666; font-size: 14px;">If you have further questions, contact us at <a href="mailto:info@jtapkitchen.com" style="color: #c89b4f;">info@jtapkitchen.com</a> or call <strong>901-233-4060</strong>.</p>
          </div>
          <div style="padding: 24px 32px; background-color: #1a1a1a; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} JTAP Kitchen · Memphis, TN</p>
          </div>
        </div>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});