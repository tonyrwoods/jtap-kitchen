import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automations (no user) or admin manual trigger
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoStr = oneWeekAgo.toISOString().slice(0, 10);

    // Fetch all data in parallel
    const [reservations, reviews, giftCards, members, admins] = await Promise.all([
      base44.asServiceRole.entities.Reservation.list('-created_date', 200),
      base44.asServiceRole.entities.Review.list('-created_date', 200),
      base44.asServiceRole.entities.GiftCard.list('-created_date', 200),
      base44.asServiceRole.entities.LoyaltyMember.list('-created_date', 200),
      base44.asServiceRole.entities.User.filter({ role: 'admin' }),
    ]);

    const newReservations = reservations.filter(r => r.created_date >= weekAgoStr);
    const newReviews = reviews.filter(r => r.created_date >= weekAgoStr);
    const newGiftCards = giftCards.filter(g => g.created_date >= weekAgoStr);
    const newMembers = members.filter(m => m.created_date >= weekAgoStr);

    const confirmedRes = newReservations.filter(r => r.status === 'Confirmed');
    const pendingRes = newReservations.filter(r => r.status === 'Pending');
    const avgRating = newReviews.length
      ? (newReviews.reduce((s, r) => s + (r.rating || 0), 0) / newReviews.length).toFixed(1)
      : 'N/A';
    const giftCardRevenue = newGiftCards.reduce((s, g) => s + (g.amount || 0), 0).toFixed(2);

    const weekLabel = `${oneWeekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const recentReservationsRows = newReservations.slice(0, 8).map(r =>
      `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:8px 12px;font-size:13px;">${r.guest_name}</td>
        <td style="padding:8px 12px;font-size:13px;">${r.date} ${r.time}</td>
        <td style="padding:8px 12px;font-size:13px;">${r.party_size} guests</td>
        <td style="padding:8px 12px;font-size:13px;">
          <span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:${r.status === 'Confirmed' ? '#dcfce7' : r.status === 'Pending' ? '#fef9c3' : '#fee2e2'};color:${r.status === 'Confirmed' ? '#166534' : r.status === 'Pending' ? '#854d0e' : '#991b1b'}">
            ${r.status}
          </span>
        </td>
      </tr>`
    ).join('');

    const body = `
<div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;color:#1a1a1a;background:#faf9f7;">
  <div style="background:#1a1a1a;padding:32px;text-align:center;">
    <h1 style="color:#c89b4f;font-size:24px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
    <p style="color:#888;font-size:13px;margin:8px 0 0;">Weekly Admin Digest · ${weekLabel}</p>
  </div>

  <div style="padding:32px;">
    <h2 style="font-size:18px;margin:0 0 20px;color:#1a1a1a;">📊 Key Metrics This Week</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px;">
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:32px;font-weight:bold;color:#c89b4f;margin:0;">${newReservations.length}</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">New Reservations</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:32px;font-weight:bold;color:#c89b4f;margin:0;">${confirmedRes.length}</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Confirmed</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:32px;font-weight:bold;color:#c89b4f;margin:0;">${pendingRes.length}</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Pending Review</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:32px;font-weight:bold;color:#c89b4f;margin:0;">${newReviews.length}</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">New Reviews</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:32px;font-weight:bold;color:#c89b4f;margin:0;">${avgRating}⭐</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Avg Rating</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">
        <p style="font-size:32px;font-weight:bold;color:#c89b4f;margin:0;">$${giftCardRevenue}</p>
        <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">Gift Card Sales</p>
      </div>
    </div>

    ${newReservations.length > 0 ? `
    <h2 style="font-size:18px;margin:0 0 16px;color:#1a1a1a;">📅 New Reservations</h2>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;margin-bottom:32px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Guest</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Date & Time</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Party</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Status</th>
        </tr>
      </thead>
      <tbody>${recentReservationsRows}</tbody>
    </table>
    ` : '<p style="color:#888;font-size:14px;">No new reservations this week.</p>'}

    ${newMembers.length > 0 ? `<p style="color:#666;font-size:14px;">🏅 <strong>${newMembers.length}</strong> new loyalty member(s) joined this week.</p>` : ''}

    <div style="text-align:center;margin-top:32px;">
      <a href="https://app.base44.com" style="background:#c89b4f;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">Open Admin Dashboard</a>
    </div>
  </div>

  <div style="background:#1a1a1a;padding:20px;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0;">© ${new Date().getFullYear()} JTAP Kitchen · This is an automated weekly digest</p>
  </div>
</div>`;

    // Send to all admins
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `JTAP Kitchen — Weekly Digest (${weekLabel})`,
        body,
      });
    }

    return Response.json({ success: true, sent_to: admins.length, reservations: newReservations.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});