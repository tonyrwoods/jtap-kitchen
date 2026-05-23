import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Phone, Mail, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

// Gold accent color used throughout for brand consistency
const GOLD = "#C89B4F";

const SUGGESTIONS = [
  { label: "Reserve a Table", icon: "🍽️" },
  { label: "Browse the Menu", icon: "📋" },
  { label: "Upcoming Events", icon: "✨" },
  { label: "Loyalty Program", icon: "⭐" },
  { label: "Gift Cards", icon: "🎁" },
  { label: "Restaurant Hours", icon: "🕐" },
];

const STAFF_SUGGESTIONS = [
  { label: "Kitchen Dashboard", icon: "👨‍🍳" },
  { label: "Staff Scheduler", icon: "📅" },
  { label: "Revenue Analytics", icon: "📊" },
  { label: "Inventory Management", icon: "📦" },
];

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(200,155,79,0.15)", border: "1px solid rgba(200,155,79,0.3)" }}
      >
        <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
      </div>
      <div
        className="rounded-2xl rounded-bl-sm px-5 py-3.5"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex gap-1.5 items-center h-4">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.div
              key={delay}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: GOLD }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, delay, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} items-end`}>
      {!isUser && (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(200,155,79,0.15)", border: "1px solid rgba(200,155,79,0.3)" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-sm font-body leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={
          isUser
            ? { background: GOLD, color: "#1a1208" }
            : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)" }
        }
      >
        {isUser ? (
          <p className="font-medium">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none prose-invert"
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>{children}</p>,
              ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="my-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{children}</li>,
              strong: ({ children }) => <strong className="font-semibold" style={{ color: GOLD }}>{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: GOLD }}>
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(200,155,79,0.15)", color: GOLD }}>
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function ReservationChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = "Dining Assistant — JTAP Kitchen";
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const initConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "reservation_assistant",
      metadata: { name: "Guest Chat" },
    });
    setConversation(conv);
    setLoading(false);
    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const visibleMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const hasMessages = visibleMessages.length > 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0d0b08 0%, #1a1410 50%, #0d0b08 100%)" }}
    >
      {/* Header */}
      <div
        className="relative overflow-hidden text-center px-6 py-14"
        style={{ borderBottom: "1px solid rgba(200,155,79,0.15)" }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,155,79,0.1) 0%, transparent 70%)" }}
        />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(200,155,79,0.12)", border: "1px solid rgba(200,155,79,0.35)" }}
          >
            <Sparkles className="w-7 h-7" style={{ color: GOLD }} />
          </div>
          <p className="font-body text-xs uppercase tracking-[0.3em] font-semibold mb-2" style={{ color: GOLD }}>
            JTAP Kitchen
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Dining Assistant
          </h1>
          <p className="font-body text-sm max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Experience fine dining elevated — I'm here to help you reserve your table, explore our seasonal menu, and make the most of your visit.
          </p>
        </motion.div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col px-4 py-6 pb-4">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(200,155,79,0.1)", border: "1px solid rgba(200,155,79,0.25)" }}
            >
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
            </div>
            <p className="font-body text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Preparing your assistant…</p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pb-4 min-h-[360px] max-h-[58vh] scrollbar-hide">
              <AnimatePresence initial={false}>
                {!hasMessages && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="py-6 text-center"
                  >
                    <p className="font-heading text-xl text-white mb-1">Welcome to JTAP Kitchen</p>
                    <p className="font-body text-sm mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                      How may I assist you this evening?
                    </p>

                    {/* Guest suggestions */}
                    <div className="mb-3">
                      <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(200,155,79,0.6)" }}>
                        For Guests
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => handleSend(s.label)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm transition-all hover:scale-105"
                            style={{
                              background: "rgba(200,155,79,0.08)",
                              border: "1px solid rgba(200,155,79,0.25)",
                              color: "rgba(255,255,255,0.75)",
                            }}
                          >
                            <span>{s.icon}</span>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Staff toggle */}
                    <div className="mt-6">
                      <button
                        onClick={() => setShowStaffSuggestions((v) => !v)}
                        className="font-body text-xs transition-colors"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        Staff or Admin? →
                      </button>
                      <AnimatePresence>
                        {showStaffSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(200,155,79,0.6)" }}>
                              Management Tools
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {STAFF_SUGGESTIONS.map((s) => (
                                <button
                                  key={s.label}
                                  onClick={() => handleSend(s.label)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm transition-all hover:scale-105"
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    color: "rgba(255,255,255,0.6)",
                                  }}
                                >
                                  <span>{s.icon}</span>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {visibleMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MessageBubble message={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="mt-4 space-y-3">
              <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about JTAP Kitchen…"
                  disabled={sending}
                  className="flex-1 rounded-2xl px-5 py-3.5 text-sm font-body focus:outline-none disabled:opacity-50 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(200,155,79,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 disabled:opacity-30 disabled:scale-100"
                  style={{ background: GOLD }}
                >
                  <Send className="w-4 h-4" style={{ color: "#1a1208" }} />
                </button>
              </form>

              {/* Footer links */}
              <div
                className="flex items-center justify-center gap-5 text-xs font-body pb-1"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                <Link to="/contact" className="flex items-center gap-1 hover:opacity-60 transition-opacity">
                  <Mail className="w-3 h-3" /> Contact Us
                </Link>
                <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                <a href="tel:9012334060" className="flex items-center gap-1 hover:opacity-60 transition-opacity">
                  <Phone className="w-3 h-3" /> 901-233-4060
                </a>
                <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                <Link to="/support" className="flex items-center gap-1 hover:opacity-60 transition-opacity">
                  <ExternalLink className="w-3 h-3" /> Support
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}