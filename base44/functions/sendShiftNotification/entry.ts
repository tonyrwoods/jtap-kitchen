import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // Allow entity automation triggers (have an event.type field) or admin users
    const isAutomation = !!payload?.event?.type;
    if (!isAutomation && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const event = payload.event || {};
    const data = payload.data || {};

    // Get shift and staff details
    const shift = data;
    const staffMember = await base44.entities.Staff.list("-created_date", 100);
    const staff = staffMember.find(s => s.id === shift.staff_id);

    if (!staff || !staff.email) {
      return Response.json({ error: 'Staff email not found' }, { status: 400 });
    }

    // Determine if this is a new assignment or an update
    const isNewShift = event.type === 'create';
    const oldData = payload.old_data || {};
    const dateChanged = oldData.date && oldData.date !== shift.date;
    const blockChanged = oldData.time_block && oldData.time_block !== shift.time_block;

    let subject = '';
    let body = '';

    if (isNewShift) {
      subject = `✓ You've been assigned to a shift - ${shift.date}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #1a1a1a; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">JTAP Kitchen</h1>
          </div>
          <div style="padding: 32px; background: #faf9f7;">
            <h2 style="color: #1a1a1a; margin-top: 0;">New Shift Assignment</h2>
            <p>Hi <strong>${staff.name}</strong>,</p>
            <p>You have been assigned a new shift:</p>
            <div style="background: white; border: 1px solid #ddd; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${shift.time_block}</p>
              <p style="margin: 8px 0;"><strong>Role:</strong> ${shift.role || 'TBD'}</p>
              ${shift.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${shift.notes}</p>` : ''}
            </div>
            <p>Please confirm your availability and let management know if you have any conflicts.</p>
          </div>
          <div style="background: #1a1a1a; color: #999; padding: 24px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2026 JTAP Kitchen · Memphis, TN</p>
          </div>
        </div>
      `;
    } else if (dateChanged || blockChanged) {
      subject = `⚠ Your shift time has changed - ${shift.date}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #1a1a1a; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">JTAP Kitchen</h1>
          </div>
          <div style="padding: 32px; background: #faf9f7;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Shift Change Notification</h2>
            <p>Hi <strong>${staff.name}</strong>,</p>
            <p>Your shift has been modified:</p>
            <div style="background: white; border: 1px solid #ddd; padding: 16px; border-radius: 8px; margin: 20px 0;">
              ${dateChanged ? `
                <p style="margin: 8px 0;"><strong>Previous Date:</strong> <strike>${new Date(oldData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strike></p>
                <p style="margin: 8px 0;"><strong>New Date:</strong> ${new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              ` : `<p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`}
              ${blockChanged ? `
                <p style="margin: 8px 0;"><strong>Previous Time:</strong> <strike>${oldData.time_block}</strike></p>
                <p style="margin: 8px 0;"><strong>New Time:</strong> ${shift.time_block}</p>
              ` : `<p style="margin: 8px 0;"><strong>Time:</strong> ${shift.time_block}</p>`}
              <p style="margin: 8px 0;"><strong>Role:</strong> ${shift.role || 'TBD'}</p>
            </div>
            <p>If you have any concerns about this change, please contact management immediately.</p>
          </div>
          <div style="background: #1a1a1a; color: #999; padding: 24px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2026 JTAP Kitchen · Memphis, TN</p>
          </div>
        </div>
      `;
    } else {
      // Other updates (role, notes) - no notification
      return Response.json({ success: true, message: 'No notification needed for this update' });
    }

    // Send the email
    await sendEmailViaGmail(base44, {
      to: staff.email,
      subject,
      body,
    });

    return Response.json({
      success: true,
      message: `Notification sent to ${staff.email}`,
      staffName: staff.name,
      eventType: isNewShift ? 'new_assignment' : 'shift_changed',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});