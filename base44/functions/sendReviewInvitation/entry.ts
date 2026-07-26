import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { reservation_id } = await req.json();

    if (!reservation_id) {
      return Response.json({ error: "reservation_id is required" }, { status: 400 });
    }

    const reservation = await base44.asServiceRole.entities.Reservation.get(reservation_id);

    if (!reservation) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (!reservation.email) {
      return Response.json({ error: "Guest email not found" }, { status: 400 });
    }

    const reviewLink = `${Deno.env.get('APP_URL') || 'https://app.example.com'}/submit-review?name=${encodeURIComponent(reservation.guest_name)}&email=${encodeURIComponent(reservation.email)}&date=${encodeURIComponent(reservation.date)}`;

    const emailBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a1a; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #C89B4F 0%, #936633 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; }
      .section { margin: 20px 0; }
      .cta { display: inline-block; background: #C89B4F; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
      .stars { font-size: 20px; letter-spacing: 2px; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Share Your Experience</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${reservation.guest_name}</strong>,</p>
        
        <div class="section">
          <p>Thank you for choosing JTAP Kitchen for your meal on <strong>${new Date(reservation.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>. We hope you had a wonderful experience!</p>
          
          <p>We'd love to hear about your visit. Your feedback helps us continue to provide exceptional service and delicious food to our guests.</p>
        </div>

        <div class="section" style="text-align: center;">
          <p style="font-size: 18px;">How would you rate your experience?</p>
          <div class="stars">★ ★ ★ ★ ★</div>
        </div>

        <div style="text-align: center;">
          <a href="${reviewLink}" class="cta">Leave Your Review</a>
        </div>

        <div class="section" style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #C89B4F;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            Your honest feedback takes just 2 minutes and makes a real difference. Thank you!
          </p>
        </div>

        <div class="footer">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 11px;">${reviewLink}</p>
          <p>© JTAP Kitchen. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

    await sendEmailViaGmail(base44, {
      to: reservation.email,
      subject: `Share Your Feedback - ${reservation.guest_name}`,
      body: emailBody,
      from_name: "JTAP Kitchen",
    });

    return Response.json({
      status: "success",
      message: `Review invitation sent to ${reservation.email}`,
    });
  } catch (error) {
    console.error("Error in sendReviewInvitation:", error);
    return Response.json(
      { error: error.message, status: "failed" },
      { status: 500 }
    );
  }
});