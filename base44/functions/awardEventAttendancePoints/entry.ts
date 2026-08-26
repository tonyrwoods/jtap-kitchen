import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

// Scheduled job: after an event's date has passed, award loyalty points to
// every JTAP Room Society member who RSVP'd "Attending". Each promotion is
// processed exactly once (guarded by `attendance_points_awarded` on the
// EventPromotion) so re-runs never double-award.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const today = new Date().toISOString().split('T')[0];

    // Promotions whose date has passed and haven't been awarded yet.
    const promos = await base44.asServiceRole.entities.EventPromotion.list('-created_date', 200);
    const toProcess = promos.filter((p) => p.date && p.date < today && !p.attendance_points_awarded);

    if (toProcess.length === 0) {
      return Response.json({ success: true, promotionsProcessed: 0, membersAwarded: 0, totalAwarded: 0 });
    }

    // Points per attendance — default 50, override via AppSettings.event_attendance_points.
    const settings = await base44.asServiceRole.entities.AppSettings.list().then((d) => d[0]);
    const pointsPerAttendance = (settings && settings.event_attendance_points) || 50;

    // Build a case-insensitive email -> member map so we don't filter per invite.
    const allMembers = await base44.asServiceRole.entities.TapRoomMember.list('-created_date', 500);
    const memberByEmail = new Map();
    for (const m of allMembers) {
      if (m.email) memberByEmail.set(m.email.toLowerCase(), m);
    }

    let totalAwarded = 0;
    let membersAwarded = 0;

    for (const promo of toProcess) {
      const invites = await base44.asServiceRole.entities.EventInvite.filter({ promotion_id: promo.id });
      const attending = invites.filter((i) => i.rsvp_status === 'Attending');

      for (const inv of attending) {
        if (!inv.guest_email) continue;
        const member = memberByEmail.get(inv.guest_email.toLowerCase());
        if (!member) continue; // only JTAP Room Society members earn points

        const newBalance = (member.points_balance || 0) + pointsPerAttendance;
        await base44.asServiceRole.entities.TapRoomMember.update(member.id, {
          points_balance: newBalance,
          total_points_earned: (member.total_points_earned || 0) + pointsPerAttendance,
          total_visits: (member.total_visits || 0) + 1,
          last_visit_date: promo.date,
        });

        await base44.asServiceRole.entities.PointsActivity.create({
          member_id: member.id,
          member_name: member.guest_name,
          member_email: member.email,
          transaction_type: 'Earn',
          points: pointsPerAttendance,
          balance_after: newBalance,
          trigger: 'visit',
          description: `Attended ${promo.title}`,
          transaction_date: promo.date,
        });

        totalAwarded += pointsPerAttendance;
        membersAwarded += 1;
      }

      // Mark processed regardless of whether members matched, so we don't re-scan.
      await base44.asServiceRole.entities.EventPromotion.update(promo.id, { attendance_points_awarded: true });
    }

    return Response.json({
      success: true,
      promotionsProcessed: toProcess.length,
      membersAwarded,
      totalAwarded,
    });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: 'Event attendance points job crashed',
      body: `The attendance points award job threw an uncaught error — points may not have been awarded.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});