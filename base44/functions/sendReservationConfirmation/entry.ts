import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const reservation = body.data;
    if (!reservation || !reservation.email) {
      return Response.json({ error: 'No reservation data' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const guestName = reservation.guest_name || 'Guest';
    const date = reservation.date || '';
    const time = reservation.time || '';
    const partySize = reservation.party_size || '';
    const specialRequests = reservation.special_requests ? `<p><strong>Special Requests:</strong> ${reservation.special_requests}</p>` : '';

    const htmlBody = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background-color: #1a1a1a; padding: 32px; text-align: center;">
          <h1 style="color: #c89b4f; font-size: 28px; margin: 0; letter-spacing: 2px;">JTAP Kitchen</h1>
        </div>
        <div style="padding: 40px 32px; background-color: #faf9f7;">
          <h2 style="font-size: 22px; color: #1a1a1a; margin-bottom: 8px;">Reservation Confirmed</h2>
          <p style="color: #666; margin-bottom: 32px;">Thank you, ${guestName}. We look forward to welcoming you.</p>
          <div style="background: #fff; border: 1px solid #e8e2d8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; width: 40%;">Date</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; font-size: 15px; font-weight: 600;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Time</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; font-size: 15px; font-weight: 600;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Guests</td>
                <td style="padding: 10px 0; font-size: 15px; font-weight: 600;">${partySize}</td>
              </tr>
            </table>
          </div>
          ${specialRequests}
          <p style="color: #666; font-size: 14px;">If you need to modify or cancel your reservation, please contact us at <a href="mailto:info@jtapkitchen.com" style="color: #c89b4f;">info@jtapkitchen.com</a> or call <strong>901-233-4060</strong>.</p>
        </div>
        <div style="padding: 24px 32px; background-color: #1a1a1a; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} JTAP Kitchen · Memphis, TN</p>
        </div>
      </div>
    `;

    const subject = `Reservation Confirmed – ${date} at ${time}`;
    const toHeader = `${guestName} <${reservation.email}>`;

    const mimeMessage = [
      `To: ${toHeader}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlBody
    ].join('\r\n');

    const encoded = btoa(unescape(encodeURIComponent(mimeMessage)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});