import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Loader2, Lightbulb, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIWasteAdvisor({ forecast, summary }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const buildContext = () => {
    const urgent = forecast.filter(i => i.status !== "OK");
    const expiringSoon = forecast.filter(i => {
      if (!i.expiry_date) return false;
      const daysUntilExpiry = Math.floor((new Date(i.expiry_date) - new Date()) / 86400000);
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    return `You are an expert restaurant inventory and waste reduction AI advisor for JTAP Kitchen.

Current inventory snapshot (${summary?.total_items || 0} items total):
- Out of Stock: ${summary?.out_of_stock || 0}
- Low Stock: ${summary?.low_stock || 0}
- Reorder Soon: ${summary?.reorder_soon || 0}
- Invoices analyzed (last 30 days): ${summary?.invoices_analyzed || 0}

Urgent items needing attention:
${urgent.length > 0 ? urgent.map(i => `- ${i.name} (${i.status}): ${i.current_stock} ${i.unit} remaining, 7-day forecast: ${i.forecast_7d} ${i.unit}, days left: ${i.days_of_stock_remaining ?? "unknown"}`).join("\n") : "None"}

Items expiring within 7 days:
${expiringSoon.length > 0 ? expiringSoon.map(i => `- ${i.name}: expires ${i.expiry_date}`).join("\n") : "None"}

Provide concise, actionable advice. Focus on waste reduction, smart ordering, and menu-ingredient alignment.`;
  };

  const sendMessage = async (userMsg) => {
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const contextPrompt = buildContext();
    const conversationHistory = newMessages.map(m => `${m.role === "user" ? "Manager" : "AI Advisor"}: ${m.content}`).join("\n\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${contextPrompt}\n\nConversation:\n${conversationHistory}\n\nAI Advisor:`,
    });

    const aiMsg = typeof response === "string" ? response : (response?.text || response?.content || JSON.stringify(response));
    setMessages(prev => [...prev, { role: "assistant", content: aiMsg }]);
    setLoading(false);
  };

  const handleInitialize = () => {
    setInitialized(true);
    sendMessage("Give me a quick overview of the current inventory health and your top 3 waste reduction recommendations.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  const QUICK_PROMPTS = [
    "Which items should I reorder today?",
    "How can I reduce food waste this week?",
    "What menu items use expiring ingredients?",
    "Suggest a reorder schedule for low stock items",
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* AI Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-body text-sm font-semibold">AI Waste Reduction Advisor</p>
          <p className="font-body text-xs text-muted-foreground">Powered by inventory data & sales history</p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-4 min-h-[200px] max-h-[420px] overflow-y-auto">
        {!initialized && messages.length === 0 && (
          <div className="text-center py-6 space-y-4">
            <Lightbulb className="w-10 h-10 text-primary/50 mx-auto" />
            <p className="font-body text-sm text-muted-foreground">Ask the AI advisor about your inventory, waste reduction strategies, or reorder recommendations.</p>
            <button
              onClick={handleInitialize}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
            >
              Analyze My Inventory
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === "user"
                ? "bg-foreground text-background"
                : "bg-muted text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <ReactMarkdown className="font-body text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="font-body text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {initialized && messages.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="px-3 py-1 border border-border rounded-full font-body text-xs hover:bg-muted transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {initialized && (
        <form onSubmit={handleSubmit} className="flex gap-3 px-5 pb-5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about inventory, waste, reordering…"
            className="flex-1 border border-border rounded-full px-4 py-2 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}