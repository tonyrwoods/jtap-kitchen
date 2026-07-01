import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const { invoiceId } = await req.json();

    const invoice = await base44.asServiceRole.entities.Invoice.read(invoiceId);
    if (!invoice || invoice.status !== "Paid" || invoice.items?.some(i => i.name?.includes("Vendor"))) {
      return Response.json({ success: false, reason: "not_eligible" });
    }

    const appSettings = await base44.asServiceRole.entities.AppSettings.list().then(data => data[0]);
    const pointsPerDollar = appSettings?.loyalty_points_per_dollar || 1;
    const points = Math.floor(invoice.total * pointsPerDollar);

    let member = null;
    if (invoice.customer_email) {
      const members = await base44.asServiceRole.entities.LoyaltyMember.filter({ email: invoice.customer_email });
      member = members[0];
    }

    if (!member) return Response.json({ success: false, reason: "no_member" });

    const newPoints = (member.total_points || 0) + points;
    const tiers = [
      { threshold: 5000, name: "Platinum" },
      { threshold: 1500, name: "Gold" },
      { threshold: 500, name: "Silver" },
    ];
    const newTier = tiers.find(t => member.total_spending + invoice.total >= t.threshold) || { name: "Bronze" };

    await base44.asServiceRole.entities.LoyaltyMember.update(member.id, {
      total_points: newPoints,
      total_spending: (member.total_spending || 0) + invoice.total,
      tier_id: newTier.name.toLowerCase(),
      tier_name: newTier.name,
    });

    return Response.json({ success: true, points, newTier: newTier.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});