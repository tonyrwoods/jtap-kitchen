import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'token required' }, { status: 400 });
    }

    const invites = await base44.asServiceRole.entities.EventInvite.filter({ invite_token: token });
    const invite = invites[0];
    if (!invite) {
      return Response.json({ error: 'Invite not found' }, { status: 404 });
    }

    const promotions = await base44.asServiceRole.entities.EventPromotion.filter({ id: invite.promotion_id });
    const promotion = promotions[0] || null;

    return Response.json({ invite, promotion });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}