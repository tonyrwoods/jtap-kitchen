import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow entity automations (no user) or admin manual trigger
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { event } = body;

    if (event.type !== 'create') return Response.json({ skipped: true });

    const reservation = event.data;
    if (!reservation.email || !reservation.guest_name) {
      return Response.json({ error: 'Missing email or name' }, { status: 400 });
    }

    // Determine if this is an event booking or regular reservation
    const isEventBooking = reservation.special_requests?.startsWith('[Event:');
    const dateObj = new Date(reservation.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const subject = isEventBooking 
      ? `Event Booking Confirmation - ${reservation.date}` 
      : `Reservation Confirmation - ${formattedDate}`;

    const body_html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: linear-gradient(135deg, #C89B4F 0%, #A67C3F 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px;">
            ${isEventBooking ? '🎉 Event Booking Confirmed!' : '🍽️ Reservation Confirmed!'}
          </h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 20px; font-size: 16px;">
            Hi <strong>${reservation.guest_name}</strong>,
          </p>
          
          <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666;">
            ${isEventBooking 
              ? 'Thank you for booking our special event! We\'re excited to welcome you.' 
              : 'Thank you for your reservation! We look forward to hosting you.'}
          </p>

          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px; font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Reservation Details</h2>
            
            <div style="margin-bottom: 12px;">
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Date & Time</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${formattedDate} at ${reservation.time}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Party Size</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${reservation.party_size} guest${reservation.party_size !== 1 ? 's' : ''}</p>
            </div>

            <div>
              <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Confirmation Number</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; font-family: monospace;">${reservation.id.substring(0, 8).toUpperCase()}</p>
            </div>

            ${reservation.special_requests ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 5px; font-size: 12px; color: #999; text-transform: uppercase;">Special Requests</p>
                <p style="margin: 0; font-size: 14px; font-style: italic;">${reservation.special_requests}</p>
              </div>
            ` : ''}
          </div>

          <div style="background: #fffbf0; border-left: 4px solid #C89B4F; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #666;">
              <strong>📧 Please save this email</strong> for your records. We may request this confirmation number at the time of your visit.
            </p>
          </div>

          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
            If you need to cancel or modify your reservation, please contact us as soon as possible.
          </p>

          <p style="margin: 20px 0 0; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            © JTAP Kitchen. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await sendEmailViaGmail(base44, {
      to: reservation.email,
      subject: subject,
      body: body_html,
      from_name: 'JTAP Kitchen'
    });

    return Response.json({ sent: true, email: reservation.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});