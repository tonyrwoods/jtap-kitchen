import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { notifyAdmins } from "../../shared/notifyAdmins.js";

// Expires unpaid event-center inquiries older than EXPIRY_DAYS so they don't
// linger in the admin dashboard as "New". Idempotent and safe: only touches
// inquiries with deposit_status "Unpaid" AND status "New". Runs from a daily
// scheduled workflow, which executes as the workflow owner (admin) — matching
// every other scheduled job in the app — so the admin auth check passes for
// the automation while blocking unauthenticated direct HTTP invocation.

const EXPIRY_DAYS = 7;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const cutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const inquiries = await base44.asServiceRole.entities.EventCenterInquiry.filter(
      { deposit_status: "Unpaid", status: "New" },
      "created_date",
      500
    );
    const stale = inquiries.filter((i) => i.created_date && i.created_date < cutoff);

    let expired = 0;
    if (stale.length > 0) {
      await base44.asServiceRole.entities.EventCenterInquiry.updateMany(
        { _id: { $in: stale.map((i) => i.id) } },
        { $set: { status: "Expired" } }
      );
      expired = stale.length;
    }

    return Response.json({ success: true, expired, checked: inquiries.length });
  } catch (error) {
    await notifyAdmins(base44, {
      subject: "Event inquiry cleanup job crashed",
      body: `The daily event inquiry cleanup job threw an uncaught error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
    }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
}