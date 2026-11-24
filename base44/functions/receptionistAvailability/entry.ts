import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeReceptionist, unauthorized } from '../../shared/receptionistAuth.js';
import { buildDayAvailability } from '../../shared/reservationSlots.js';

// AI receptionist tool: live table availability for one date and party size.
// Returns the same slot grid the website booking form uses — aggregate counts
// only, never another guest's details.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await authorizeReceptionist(req, base44))) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const date = String(body.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'date is required as YYYY-MM-DD' }, { status: 400 });
    }

    const availability = await buildDayAvailability(base44, date, body.party_size);
    return Response.json(availability);
  } catch (error) {
    console.error('receptionistAvailability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}