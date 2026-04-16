import { base44 } from "@/api/base44Client";

export const logInvoiceAction = async (invoiceId, vendorName, action, details = "", changes = null) => {
  try {
    const user = await base44.auth.me();
    
    await base44.entities.AuditLog.create({
      invoice_id: invoiceId,
      vendor_name: vendorName,
      action,
      details,
      admin_email: user?.email || "system",
      timestamp: new Date().toISOString(),
      changes,
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
};