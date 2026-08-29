// Shared helpers for event RSVP capacity management, used by both the
// token-based (submitEventRSVP) and public (submitPublicEventRSVP) flows.

// Promotes the oldest waitlisted parties (that fit) into newly freed capacity.
// Promoted guests are updated to "Attending", which triggers the existing
// sendRsvpConfirmation entity automation to email them a confirmation.
export async function autoPromoteWaitlist(base44, promotionId, promotion) {
  const allInvites = await base44.asServiceRole.entities.EventInvite.filter({ promotion_id: promotionId });
  const attendingTotal = allInvites
    .filter((i) => i.rsvp_status === 'Attending')
    .reduce((sum, i) => sum + (i.party_size || 1), 0);

  let available = Math.max(0, (promotion.max_guests || 0) - attendingTotal);
  if (available <= 0) return { promoted: 0 };

  const waitlisted = allInvites
    .filter((i) => i.rsvp_status === 'Waitlisted')
    .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));

  let promoted = 0;
  for (const w of waitlisted) {
    if (available <= 0) break;
    const wSize = w.party_size || 1;
    if (wSize > available) continue; // party too large to fit the freed slots right now
    await base44.asServiceRole.entities.EventInvite.update(w.id, {
      rsvp_status: 'Attending',
      rsvp_responded_at: new Date().toISOString(),
    });
    available -= wSize;
    promoted += 1;
  }
  return { promoted };
}

export function buildWaitlistEmail(promotion, invite) {
  const dateStr = promotion.date
    ? new Date(promotion.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#faf9f7;padding:40px 20px;color:#1a1a1a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d5;">
    <div style="background:#1a1a1a;padding:32px;text-align:center;">
      <h1 style="color:#C89B4F;font-size:28px;margin:0;letter-spacing:1px;">JTAP Kitchen</h1>
      <p style="color:#999;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">You're on the Waitlist</p>
    </div>
    <div style="padding:40px 36px;">
      <h2 style="font-size:22px;margin:0 0 8px;">Hi ${escapeHtml(invite.guest_name)},</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;"><strong>${escapeHtml(promotion.title)}</strong> is currently at capacity, so we've added your party of ${invite.party_size || 1} to the waitlist${dateStr ? ` for ${dateStr}` : ''}.</p>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">If a spot opens up, we'll automatically confirm your attendance and email you right away — no action needed on your part.</p>
      <p style="color:#999;font-size:13px;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">
        Need to change your response? Visit your <a href="https://jtapkitchen.com/event-invite/${invite.invite_token}" style="color:#C89B4F;">RSVP link</a> anytime.<br/>
        JTAP Kitchen &middot; Memphis, TN &middot; info@jtapkitchen.com
      </p>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}