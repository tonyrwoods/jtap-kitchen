import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const GOLD = "#C89B4F";

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <Sparkles className="w-3.5 h-3.5 text-green-400" />
      </div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex gap-1 items-center h-3">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.div key={delay} className="w-1.5 h-1.5 rounded-full bg-green-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, delay, repeat: Infinity }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} items-end`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <Sparkles className="w-3.5 h-3.5 text-green-400" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
        style={isUser
          ? { background: GOLD, color: "#1a1208" }
          : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}>
        {isUser ? (
          <p className="font-medium font-body">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none"
            components={{
              p: ({ children }) => <p className="my-0.5 leading-relaxed font-body" style={{ color: "rgba(255,255,255,0.88)" }}>{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              li: ({ children }) => <li className="my-0.5 font-body" style={{ color: "rgba(255,255,255,0.85)" }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: GOLD }}>{children}</strong>,
              a: ({ href, children }) => <a href={href} style={{ color: GOLD }} className="underline underline-offset-2">{children}</a>,
            }}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "Reserve a table",
  "Today's hours",
  "View the menu",
  "Host an event",
];

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [init, setInit] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const initConversation = async () => {
    if (init) return;
    setInit(true);
    const conv = await base44.agents.createConversation({
      agent_name: "reservation_assistant",
      metadata: { name: "Chat Widget" },
    });
    setConversation(conv);
    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });
  };

  const handleOpen = () => {
    setOpen(true);
    initConversation();
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending || !conversation) return;
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setSending(false);
    inputRef.current?.focus();
  };

  const visible = messages.filter((m) => m.role === "user" || m.role === "assistant");

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 md:bottom-20 right-4 z-50 w-[340px] sm:w-[380px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ height: "520px", background: "linear-gradient(160deg, #0d0b08 0%, #1a1410 100%)", border: "1px solid rgba(200,155,79,0.2)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)" }}>
                <Sparkles className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-white leading-tight">JTAP Dining Assistant</p>
                <p className="font-body text-xs" style={{ color: "rgba(34,197,94,0.8)" }}>● Online</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/40 hover:text-white/80 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {visible.length === 0 && !sending && (
                <div className="text-center pt-6 pb-2">
                  <p className="font-heading text-base text-white mb-1">Hi there! 👋</p>
                  <p className="font-body text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    How can I help you today?
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p} onClick={() => handleSend(p)}
                        className="px-3 py-1.5 rounded-full font-body text-xs transition-all hover:scale-105"
                        style={{ background: "rgba(200,155,79,0.1)", border: "1px solid rgba(200,155,79,0.3)", color: "rgba(255,255,255,0.75)" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {visible.map((m, i) => <Bubble key={i} message={m} />)}
              {sending && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2 items-center pt-3">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything…" disabled={sending || !conversation}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-body focus:outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(200,155,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                <button type="submit" disabled={!input.trim() || sending || !conversation}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 disabled:opacity-30"
                  style={{ background: GOLD }}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#1a1208" }} /> : <Send className="w-4 h-4" style={{ color: "#1a1208" }} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 24px rgba(34,197,94,0.4)" }}
        aria-label="Open chat assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}