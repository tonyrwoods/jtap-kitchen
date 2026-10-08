import { sendEmailViaGmail } from './sendEmailViaGmail.js';
import { generateUnsubscribeToken } from './unsubscribeToken.js';

// Shared campaign-sending logic used by both the manual admin HTTP handler
// (sendNewsletterCampaign) and the scheduled auto-sender (sendScheduledCampaigns).
// Runs as service role; callers are responsible for auth where required.

export async function sendCampaignById(base44, campaignId) {
  const campaign = await base44.asServiceRole.entities.NewsletterCampaign.get(campaignId);
  if (!campaign) return { error: 'Campaign not found' };

  // Build recipient list based on segment
  let emails = [];
  const segment = campaign.segment;

  if (segment === "All Subscribers") {
    const subs = await base44.asServiceRole.entities.Subscriber.list();
    emails = subs.filter(s => s.is_active !== false).map(s => ({ email: s.email, name: s.name || "" }));
  } else if (segment === "Completed Guests") {
    const res = await base44.asServiceRole.entities.Reservation.filter({ status: "Completed" });
    emails = res.map(r => ({ email: r.email, name: r.guest_name }));
  } else if (segment === "Upcoming Reservations") {
    const today = new Date().toISOString().slice(0, 10);
    const res = await base44.asServiceRole.entities.Reservation.filter({ status: "Confirmed" });
    emails = res.filter(r => r.date >= today).map(r => ({ email: r.email, name: r.guest_name }));
  } else if (segment === "VIP Guests (4+ people)") {
    const res = await base44.asServiceRole.entities.Reservation.list();
    emails = res.filter(r => r.party_size >= 4).map(r => ({ email: r.email, name: r.guest_name }));
  } else if (segment === "Saved Contact Group") {
    if (!campaign.contact_group_id) return { error: 'No contact group selected' };
    const group = await base44.asServiceRole.entities.ContactGroup.get(campaign.contact_group_id);
    if (!group) return { error: 'Contact group not found' };
    emails = (group.contacts || []).map(c => ({ email: c.email, name: c.name || "" }));
  }

  // Deduplicate by email
  const seen = new Set();
  const unique = emails.filter(e => {
    if (!e.email || seen.has(e.email)) return false;
    seen.add(e.email);
    return true;
  });

  // Exclude unsubscribed recipients (CAN-SPAM compliance)
  const allSubs = await base44.asServiceRole.entities.Subscriber.list();
  const unsubscribed = new Set(allSubs.filter(s => s.is_active === false).map(s => (s.email || '').toLowerCase()));
  const recipients = unique.filter(r => !unsubscribed.has((r.email || '').toLowerCase()));

  const appUrl = Deno.env.get('APP_URL') || 'https://jtapkitchen.com';

  // Pre-fetch and base64-encode attachments ONCE so a multi-recipient
  // campaign doesn't re-download and re-encode each file per recipient.
  const encodedAttachments = [];
  if (Array.isArray(campaign.attachments) && campaign.attachments.length) {
    for (const att of campaign.attachments) {
      if (!att || !att.file_url) continue;
      try {
        const fileRes = await fetch(att.file_url);
        if (!fileRes.ok) continue;
        const buf = await fileRes.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        encodedAttachments.push({
          filename: att.filename || 'attachment',
          contentType: att.content_type || fileRes.headers.get('content-type') || 'application/octet-stream',
          base64: btoa(binary),
        });
      } catch {
        // skip unreadable attachment rather than failing the whole campaign
      }
    }
  }

  // Send emails — track per-recipient success/failure so one bad address
  // no longer aborts the entire campaign.
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const token = await generateUnsubscribeToken(recipient.email);
    const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}&token=${token}`;
    const personalizedBody = campaign.body
      .replace(/{{name}}/g, recipient.name || "Valued Guest")
      + buildUnsubscribeFooter(unsubscribeUrl);

    try {
      await sendEmailViaGmail(base44, {
        to: recipient.email,
        subject: campaign.subject,
        body: personalizedBody,
        attachments: encodedAttachments,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  // Update campaign status
  await base44.asServiceRole.entities.NewsletterCampaign.update(campaignId, {
    status: "Sent",
    sent_at: new Date().toISOString(),
    recipient_count: sent,
    failed_count: failed,
  });

  return { sent, failed, skipped: unique.length - recipients.length };
}

function buildUnsubscribeFooter(unsubscribeUrl) {
  return `\n<p style="text-align:center;color:#999;font-size:11px;margin-top:24px;padding-top:16px;border-top:1px solid #eee;">You're receiving this because you joined the JTAP Kitchen mailing list.<br/><a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a> &middot; JTAP Kitchen, Memphis, TN</p>`;
}