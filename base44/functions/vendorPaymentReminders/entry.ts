import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { sendEmailViaGmail } from '../../shared/sendEmailViaGmail.js';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (no user) and manual admin triggers
  let user = null;
  try {
    user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
  } catch (_) {
    // Called from a scheduled automation — no user context, proceed
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const todayStr = today.toISOString().split('T')[0];
  const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

  // Fetch all pending payments
  const allPayments = await base44.asServiceRole.entities.VendorPayment.filter({ status: 'Pending' });

  // Filter to those due within the next 3 days (inclusive)
  const upcomingPayments = allPayments.filter(p => {
    if (!p.due_date) return false;
    return p.due_date >= todayStr && p.due_date <= threeDaysStr;
  });

  if (upcomingPayments.length === 0) {
    return Response.json({ message: 'No upcoming payments found within 3 days.', sent: 0 });
  }

  // Group payments by invoice so we send one email per vendor invoice
  const byInvoice = {};
  for (const payment of upcomingPayments) {
    if (!byInvoice[payment.invoice_id]) {
      byInvoice[payment.invoice_id] = {
        vendor_name: payment.vendor_name,
        invoice_id: payment.invoice_id,
        payments: [],
      };
    }
    byInvoice[payment.invoice_id].payments.push(payment);
  }

  // Fetch invoice records to get vendor contact info (vendor emails stored in documents or notes)
  // Since invoices may not store a vendor email directly, we fetch the invoice for any additional context
  const invoiceIds = Object.keys(byInvoice);
  const invoices = await Promise.all(
    invoiceIds.map(id => base44.asServiceRole.entities.Invoice.filter({ id }))
  );

  // Build a map of invoice id -> invoice record
  const invoiceMap = {};
  for (const batch of invoices) {
    for (const inv of batch) {
      invoiceMap[inv.id] = inv;
    }
  }

  // Fetch admin users to notify (admins manage vendor payments)
  const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

  let sentCount = 0;
  const results = [];

  for (const [invoiceId, group] of Object.entries(byInvoice)) {
    const invoice = invoiceMap[invoiceId];
    const vendorName = group.vendor_name || invoice?.vendor_name || 'Unknown Vendor';

    // Build payment details rows
    const paymentRows = group.payments
      .sort((a, b) => a.payment_number - b.payment_number)
      .map(p => {
        const daysUntilDue = Math.ceil((new Date(p.due_date) - today) / (1000 * 60 * 60 * 24));
        const urgency = daysUntilDue === 0 ? '⚠️ DUE TODAY' : daysUntilDue === 1 ? '⚠️ Due tomorrow' : `Due in ${daysUntilDue} days`;
        return `  • Payment #${p.payment_number}: $${Number(p.amount).toFixed(2)} — Due ${p.due_date} (${urgency})`;
      })
      .join('\n');

    const subject = `Action Required: Upcoming Vendor Payment(s) Due — ${vendorName}`;

    const body = `Hello,

This is an automated reminder from JTAP Kitchen regarding upcoming vendor payment(s) that are due within the next 3 days.

Vendor: ${vendorName}
Invoice ID: ${invoiceId}

Pending Payments:
${paymentRows}

Please ensure these payments are processed on time to avoid any late fees or service disruptions.

You can view and manage this invoice in the Admin Dashboard → Vendor Payments tab.

---
This is an automated notification from JTAP Kitchen's payment management system.
Do not reply to this email.`;

    // Send one email per admin
    for (const admin of adminUsers) {
      if (!admin.email) continue;
      await sendEmailViaGmail(base44, {
        to: admin.email,
        subject,
        body,
        from_name: 'JTAP Kitchen Payments',
      });
      sentCount++;
    }

    // Log the notification in AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      invoice_id: invoiceId,
      vendor_name: vendorName,
      action: 'Payment Status Updated',
      details: `Automated payment reminder sent. ${group.payments.length} payment(s) due within 3 days.`,
      admin_email: 'system@jtapkitchen.com',
      timestamp: new Date().toISOString(),
    });

    results.push({ invoice_id: invoiceId, vendor_name: vendorName, payments_count: group.payments.length });
  }

  return Response.json({
    message: `Payment reminders processed. ${sentCount} email(s) sent to admin(s).`,
    sent: sentCount,
    invoices_processed: results,
  });
});