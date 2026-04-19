import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    // Skip if not a vendor invoice or no vendor email
    if (!data.is_vendor_invoice || !data.vendor_name) {
      return Response.json({ success: true, skipped: true });
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Format invoice summary for email
    const invoiceHTML = `
      <h2>Invoice Summary</h2>
      <p><strong>Invoice ID:</strong> ${data.receipt_number}</p>
      <p><strong>Vendor:</strong> ${data.vendor_name}</p>
      <p><strong>Amount:</strong> $${Number(data.total).toFixed(2)}</p>
      <p><strong>Status:</strong> ${data.approval_status}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      ${data.first_payment_due ? `<p><strong>First Payment Due:</strong> ${data.first_payment_due}</p>` : ''}
      <hr />
      <h3>Line Items</h3>
      <ul>
        ${data.items?.map(item => `<li>${item.name || 'Item'} - $${Number(item.line_total || 0).toFixed(2)}</li>`).join('') || '<li>No items</li>'}
      </ul>
    `;

    // Send email via Gmail API
    const emailResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: btoa(`To: ${data.vendor_name}\nSubject: Invoice Summary - ${data.receipt_number}\nContent-Type: text/html\n\n${invoiceHTML}`),
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Gmail API error: ${emailResponse.statusText}`);
    }

    // Update delivery status
    await base44.entities.Invoice.update(data.id, {
      delivery_status: 'sent',
      delivered_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: `Invoice emailed to ${data.vendor_name}`,
    });
  } catch (error) {
    // Log failure but don't throw - update delivery status
    try {
      const base44 = createClientFromRequest(req);
      const { data } = await req.json();
      await base44.entities.Invoice.update(data.id, {
        delivery_status: 'failed',
        delivery_error: error.message,
      });
    } catch (e) {
      // Silent fail on update error
    }
    return Response.json({ error: error.message, delivery_status: 'failed' }, { status: 500 });
  }
});