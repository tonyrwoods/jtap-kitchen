import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { segment, contact_group_id } = body;
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    let emails = [];

    if (segment === "All Subscribers") {
      const subs = await base44.asServiceRole.entities.Subscriber.list();
      emails = subs.filter(s => s.is_active !== false).map(s => ({ email: s.email, name: s.name || "" }));
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
    } else if (segment === "Saved Contact Group") {
      if (!contact_group_id) return Response.json({ error: 'No contact group selected' }, { status: 400 });
      const group = await base44.asServiceRole.entities.ContactGroup.get(contact_group_id);
      if (!group) return Response.json({ error: 'Contact group not found' }, { status: 404 });
      emails = (group.contacts || []).map(c => ({ email: c.email, name: c.name || "" }));
    }

    const seen = new Set();
    const unique = emails.filter(e => {
      if (!e.email || seen.has(e.email)) return false;
      seen.add(e.email);
      return true;
    });

    return Response.json({ success: true, count: unique.length, sample: unique.slice(0, 5) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});