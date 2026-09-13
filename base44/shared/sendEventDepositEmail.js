import { sendTransactionalEmail } from "./sendTransactionalEmail.js";

// Shared deposit-received email for the Event Center deposit flow.
// Used by the Stripe webhook (stripe-event-deposit-webhook). Best-effort:
// the caller guards re-sends via the inquiry's deposit_status idempotency check.
export async function sendEventDepositEmail(base44, inquiry, depositAmount) {
  if (!inquiry || !inquiry.email) return;
  const refNo = (inquiry.id || "").substring(0, 8).toUpperCase();
  const deposit = Number(depositAmount ?? inquiry.deposit_amount ?? 0);
  const fmtDate = inquiry.preferred_date
    ? new Date(inquiry.preferred_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "to be confirmed";
  const subject = "Deposit Received — JTAP Kitchen Event Center";
  const body = `<!DOCTYPE html>
  <html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
      <div style="background:#1a1a1a;padding:32px;text-align:center;">
        <h1 style="color:#C89B4F;font-size:24px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
        <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Deposit Received</p>
      </div>
      <div style="padding:40px 36px;">
        <h2 style="font-size:22px;margin:0 0 8px;">Hi ${inquiry.contact_name || "there"},</h2>
        <p style="color:#555;line-height:1.7;margin:0 0 24px;">We've received your <strong>$${deposit.toFixed(0)}</strong> deposit for your <strong>${inquiry.package || "event"}</strong> on <strong>${fmtDate}</strong>. Your inquiry is now submitted to our events team.</p>
        <div style="background:#f5f3f0;border-radius:12px;padding:20px;margin:0 0 24px;">
          <p style="margin:0 0 8px;font-size:14px;"><strong>Package:</strong> ${inquiry.package || "—"}</p>
          <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${fmtDate}</p>
          <p style="margin:0 0 8px;font-size:14px;"><strong>Guests:</strong> ${inquiry.guest_count || "—"}</p>
          <p style="margin:0;font-size:13px;color:#777;font-family:monospace;"><strong>Reference #:</strong> ${refNo}</p>
        </div>
        <p style="color:#555;line-height:1.7;margin:0 0 24px;">Our events team will be in touch within 24 hours to finalize the details. The remaining balance is due 7 days before your event.</p>
        <p style="color:#999;font-size:12px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com &middot; 901-554-4431</p>
      </div>
    </div>
  </body></html>`;
  await sendTransactionalEmail(base44, { to: inquiry.email, subject, body, from_name: "JTAP Kitchen" });
}