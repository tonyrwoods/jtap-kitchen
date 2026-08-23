import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendTransactionalEmail } from '../../shared/sendTransactionalEmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: scheduled runs execute as the workflow owner (admin).
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all shifts and staff
    const [shifts, staff] = await Promise.all([
      base44.asServiceRole.entities.Shift.list("-date", 1000),
      base44.asServiceRole.entities.Staff.list("-created_date", 100),
    ]);

    const staffMap = Object.fromEntries(staff.map(s => [s.id, s]));
    const now = new Date();

    // Find shifts in the next 24 hours (within 24 hours from now)
    const shiftsToRemind = shifts.filter(shift => {
      if (!shift.date || !shift.staff_id) return false;

      const shiftDate = new Date(shift.date + "T00:00:00");
      const hoursUntilShift = (shiftDate - now) / (1000 * 60 * 60);

      // Send reminder if shift is between 23 and 25 hours away
      return hoursUntilShift >= 23 && hoursUntilShift <= 25;
    });

    const sendEmailPromises = shiftsToRemind.map(async shift => {
      const staffMember = staffMap[shift.staff_id];
      
      if (!staffMember || !staffMember.email) {
        console.log(`Skipping shift ${shift.id}: staff or email not found`);
        return null;
      }

      const shiftDate = new Date(shift.date + "T00:00:00");
      const dateStr = shiftDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      // Parse time from time_block if available, otherwise use generic time
      let timeText = shift.time_block || "your scheduled time";
      
      const emailBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a1a; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #C89B4F 0%, #936633 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; }
      .shift-box { background: white; border-left: 4px solid #C89B4F; padding: 20px; margin: 20px 0; border-radius: 8px; }
      .shift-detail { margin: 10px 0; font-size: 14px; }
      .detail-label { font-weight: 600; color: #666; }
      .detail-value { color: #1a1a1a; font-size: 16px; margin-top: 4px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
      .cta { display: inline-block; background: #C89B4F; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Shift Reminder</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${staffMember.name}</strong>,</p>
        <p>This is a friendly reminder that you have a shift scheduled for <strong>tomorrow</strong>.</p>
        
        <div class="shift-box">
          <div class="shift-detail">
            <div class="detail-label">📅 Date</div>
            <div class="detail-value">${dateStr}</div>
          </div>
          <div class="shift-detail">
            <div class="detail-label">⏰ Time</div>
            <div class="detail-value">${timeText}</div>
          </div>
          <div class="shift-detail">
            <div class="detail-label">👤 Role</div>
            <div class="detail-value">${shift.role || staffMember.role || "Staff"}</div>
          </div>
        </div>

        <p>Please ensure you arrive on time and are prepared for your shift. If you have any questions or need to request a swap, please contact your manager.</p>
        
        <div style="text-align: center;">
          <a href="${Deno.env.get('APP_URL') || 'https://app.example.com'}/my-shifts" class="cta">View My Shifts</a>
        </div>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

      try {
        await sendTransactionalEmail(base44, {
          to: staffMember.email,
          subject: `Shift Reminder: ${dateStr} - ${timeText}`,
          body: emailBody,
          from_name: "Staff Scheduling System",
        });
        console.log(`Sent reminder to ${staffMember.email} for shift on ${dateStr}`);
        return { success: true, staff: staffMember.email, date: dateStr };
      } catch (error) {
        console.error(`Failed to send email to ${staffMember.email}:`, error.message);
        return { success: false, staff: staffMember.email, error: error.message };
      }
    });

    const results = await Promise.all(sendEmailPromises);
    const successful = results.filter(r => r?.success).length;
    const failed = results.filter(r => r && !r.success).length;

    return Response.json({
      status: "success",
      message: `Processed ${shiftsToRemind.length} shifts. Sent ${successful} reminders, ${failed} failed.`,
      details: results.filter(r => r),
    });
  } catch (error) {
    console.error("Error in sendShiftReminders:", error);
    return Response.json(
      { error: error.message, status: "failed" },
      { status: 500 }
    );
  }
});