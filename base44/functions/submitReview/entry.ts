import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { guest_name, email, rating, comment, visit_date } = body;

    if (!guest_name || !comment || !rating) {
      return Response.json({ error: 'Name, rating, and comment are required.' }, { status: 400 });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    // Force moderation state server-side — public submitters cannot self-approve or feature.
    const review = await base44.asServiceRole.entities.Review.create({
      guest_name,
      email: email || '',
      rating: Number(rating),
      comment,
      visit_date: visit_date || '',
      status: 'Pending',
      is_featured: false,
    });

    return Response.json({ success: true, review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}