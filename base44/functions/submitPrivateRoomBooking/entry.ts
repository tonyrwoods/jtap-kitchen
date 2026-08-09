import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notifyAdmins } from '../../shared/notifyAdmins.js';

// Member private-room booking endpoint. PrivateRoomRental's create RLS is open
// (`{}`) to any logged-in user, and the old client flow passed status,
// rental_rate, deposit_amount, and member identity from the browser — so a
// member could self-confirm a booking, zero out the rate, or impersonate
// another member. This re-derives member identity and all pricing from the
// authenticated user's TapRoomMember record and forces status to "Inquiry".

const RENTAL_RATES = {
  'Tap Member':      { Sunday: 300, Monday: 250, Tuesday: 200 },
  'Reserve Member':  { Sunday: 200, Monday: 150, Tuesday: 100 },
  'Founding Member': { Sunday: 100, Monday: 100, Tuesday: 100 },
};
const DEPOSIT = { 'Tap Member': 200, 'Reserve Member': 150, 'Founding Member': 100 };
const FB_MIN = { 'Tap Member': 500, 'Reserve Member': 400, 'Founding Member': 300 };
const DAYS_ALLOWED = ['Sunday', 'Monday', 'Tuesday'];

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

export default async function (req) {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const body = await req.json();
    const { event_date, start_time, end_time, event_type, guest_count, special_requests, av_needed, floral_needed, use_free_rental } = body;

    if (!event_date || !guest_count) {
      return Response.json({ error: 'Date and guest count are required.' }, { status: 400 });
    }
    const day = getDayOfWeek(event_date);
    if (!DAYS_ALLOWED.includes(day)) {
      return Response.json({ error: 'The private room is only available Sunday–Tuesday.' }, { status: 400 });
    }

    // Identity from the authenticated user — never trust client-supplied member info.
    const members = await base44.asServiceRole.entities.TapRoomMember.filter({ email: user.email });
    const member = members[0];
    if (!member) return Response.json({ error: 'No Tap Room Society membership found for your account.' }, { status: 403 });
    if (!member.private_room_access) {
      return Response.json({ error: 'Your membership tier does not include private room access.' }, { status: 403 });
    }

    const tier = member.tier || 'Tap Member';
    const rates = RENTAL_RATES[tier] || RENTAL_RATES['Tap Member'];
    const freeRental = !!use_free_rental && (member.free_rentals_remaining || 0) > 0;
    const rentalRate = freeRental ? 0 : (rates[day] || 0);

    const rental = await base44.asServiceRole.entities.PrivateRoomRental.create({
      member_id: member.id,
      member_name: member.guest_name,
      member_email: member.email,
      member_tier: tier,
      event_date,
      day_of_week: day,
      start_time: start_time || '18:00',
      end_time: end_time || '21:00',
      event_type: event_type || 'Private Party',
      guest_count: parseInt(guest_count) || 0,
      special_requests: special_requests || null,
      av_needed: !!av_needed,
      floral_needed: !!floral_needed,
      is_free_rental: freeRental,
      rental_rate: rentalRate,
      deposit_amount: DEPOSIT[tier] || 200,
      min_fb_spend: FB_MIN[tier] || 500,
      deposit_paid: false,
      status: 'Inquiry',
    });

    return Response.json({ success: true, rental });
  } catch (error) {
    if (base44) {
      await notifyAdmins(base44, {
        subject: 'Private room booking failed',
        body: `The submitPrivateRoomBooking function threw an error.<br><br><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toISOString()}`,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}