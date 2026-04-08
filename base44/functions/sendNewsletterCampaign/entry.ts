import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { campaignId } = body;
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const campaign = await base44.asServiceRole.entities.NewsletterCampaign.get(campaignId);
    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

    // Build recipient list based on segment
    let emails = [];
    const segment = campaign.segment;

    if (segment === "All Subscribers") {
      const subs = await base44.asServiceRole.entities.Newsletter.list();
      emails = subs.map(s => ({ email: s.email, name: "" }));
    } else if (segment === "Completed Guests") {
      const res = await base44.asServiceRole.entities.Reservation.filter({ status: "Completed" });
      emails = res.map(r => ({ email: r.email, name: r.guest_name }));
    } else if (segment === "Upcoming Reservations") {
      const today = new Date().toISOString().slice(0, 10);
      const res = await base44.asServiceRole.entities.Reservation.filter({ status: "Confirmed" });
      emails = res.filter(r => r.date >= today).map(r => ({ email: r.email, name: r.guest_name }));
    } else if (segment === "VIP Guests (4+ people)") {
      const res = await base44.asServiceRole.entities.Reservation.list();
      emails = res.filter(r => r.party_size >= 4).map(r => ({ email: r.email, name: r.guest_name }));
    }

    // Deduplicate by email
    const seen = new Set();
    const unique = emails.filter(e => {
      if (!e.email || seen.has(e.email)) return false;
      seen.add(e.email);
      return true;
    });

    // Send emails
    for (const recipient of unique) {
      const personalizedBody = campaign.body
        .replace(/{{name}}/g, recipient.name || "Valued Guest");

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient.email,
        subject: campaign.subject,
        body: personalizedBody,
      });
    }

    // Update campaign status
    await base44.asServiceRole.entities.NewsletterCampaign.update(campaignId, {
      status: "Sent",
      sent_at: new Date().toISOString(),
      recipient_count: unique.length,
    });

    return Response.json({ success: true, sent: unique.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});