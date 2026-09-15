import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Narrow, app-specific AI op: the inventory "AI Waste Reduction Advisor".
// Admin-only. The server owns the system framing; the client passes only the
// prebuilt inventory snapshot + conversation history, so this is not a generic
// LLM proxy. Runs InvokeLLM as service role to protect integration credits.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { inventoryContext, conversationHistory } = await req.json().catch(() => ({}));
    if (!inventoryContext || !conversationHistory) {
      return Response.json({ error: 'Inventory context and conversation history are required' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${inventoryContext}\n\nConversation:\n${conversationHistory}\n\nAI Advisor:`,
    });
    const reply = typeof result === 'string' ? result : (result?.text || result?.content || '');
    return Response.json({ reply });
  } catch (error) {
    console.error('generateWasteAdvisorReply error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}