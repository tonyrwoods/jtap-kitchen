import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Review Response Drafter — autonomous agent (one of the "AI agents" that work
// 24/7). Drafts manager responses for Approved guest reviews that don't yet
// have a response. The draft is written to `manager_response` WITHOUT setting
// `response_date`, so it appears as a pre-filled "AI Draft" in the Feedback
// admin tab until a manager reviews and clicks "Send Response" (which sets
// response_date and publishes it). Runs daily via the scheduled workflow.
//
// This is a narrow app op: the prompt is built server-side from structured
// review fields, not caller-supplied free text. Invoked by the scheduled
// workflow (service role) or manually by an admin.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const reviews = await base44.asServiceRole.entities.Review.filter({ status: 'Approved' });
  // Only draft for reviews with a comment and no published response yet.
  const pending = reviews.filter((r) => r.comment && !r.response_date && !r.manager_response);

  if (pending.length === 0) {
    return Response.json({ drafted: 0, total: 0 });
  }

  let drafted = 0;
  const errors = [];
  for (const review of pending) {
    try {
      const prompt = `You are the manager of JTAP Kitchen, a refined small-plates restaurant in Memphis, TN known for its Tap Room Society loyalty program and curated events.

A guest left the following review. Write a warm, professional, concise manager response (2-4 sentences) that thanks them by first name, acknowledges specific details from their comment, and invites them back. Do not invent facts, menu items, or offers not mentioned in the review. Output only the response message body in plain text — no greeting line, no sign-off, no HTML.

Guest name: ${review.guest_name || 'Guest'}
Rating: ${review.rating ?? 'N/A'} / 5
Review: "${review.comment}"

Your response:`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      const draft = (typeof result === 'string' ? result : (result?.text || result?.content || '')).toString().trim();
      if (!draft) {
        errors.push({ id: review.id, error: 'empty LLM response' });
        continue;
      }
      await base44.asServiceRole.entities.Review.update(review.id, { manager_response: draft });
      drafted++;
    } catch (err) {
      errors.push({ id: review.id, error: err.message });
    }
  }

  return Response.json({ drafted, total: pending.length, errors });
});