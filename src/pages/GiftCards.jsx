import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, CheckCircle, Search, CreditCard } from "lucide-react";
import { toast } from "sonner";

const AMOUNTS = [25, 50, 100, 150, 200];

function generateCode() {
  return "JTAP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function GiftCards() {
  useEffect(() => {
    document.title = "Gift Cards — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Give the gift of fine dining. Purchase a JTAP Kitchen gift card for any occasion.");
  }, []);
  const [tab, setTab] = useState("buy"); // "buy" | "check"
  const [checkCode, setCheckCode] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    if (!checkCode.trim()) return;
    setChecking(true);
    setCheckResult(null);
    const results = await base44.entities.GiftCard.filter({ code: checkCode.trim().toUpperCase() });
    if (results.length === 0) {
      setCheckResult({ error: "No gift card found with that code. Please check and try again." });
    } else {
      setCheckResult({ card: results[0] });
    }
    setChecking(false);
  };

  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [form, setForm] = useState({
    purchaser_name: "", purchaser_email: "",
    recipient_name: "", recipient_email: "", message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 10) {
      toast.error("Minimum gift card amount is $10.");
      return;
    }
    if (!form.purchaser_name || !form.purchaser_email) {
      toast.error("Please fill in your details.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('submitGiftCardPurchase', {
        purchaser_name: form.purchaser_name,
        purchaser_email: form.purchaser_email,
        recipient_name: form.recipient_name,
        recipient_email: form.recipient_email,
        message: form.message,
        amount: finalAmount,
      });
      if (res.data?.success) {
        toast.success("Gift card created! Email sent to recipient.");
        setSuccess({ code: res.data.code, amount: res.data.amount });
      } else {
        toast.error(res.data?.error || "Failed to create gift card. Please try again.");
      }
    } catch {
      toast.error("Failed to create gift card. Please try again.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-xl"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Order Received!</h2>
          <p className="font-body text-muted-foreground text-sm mb-6">
            Your gift card request has been submitted. Please complete payment to activate it.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
            <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-1">Voucher Code</p>
            <p className="font-heading text-2xl font-bold text-primary tracking-widest">{success.code}</p>
            <p className="font-body text-sm text-muted-foreground mt-2">Value: <span className="font-semibold text-foreground">${success.amount}</span></p>
          </div>
          <p className="font-body text-xs text-muted-foreground mb-6">
            To complete your purchase, please call us at <span className="text-foreground font-medium">901-554-4431</span> or email <span className="text-foreground font-medium">info@jtapkitchen.com</span> with your voucher code.
          </p>
          <button
            onClick={() => { setSuccess(null); setForm({ purchaser_name: "", purchaser_email: "", recipient_name: "", recipient_email: "", message: "" }); setAmount(50); setCustomAmount(""); }}
            className="px-8 py-3 border border-border rounded-full font-body text-sm font-medium hover:bg-secondary transition-colors"
          >
            Order Another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-foreground text-background py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        {/* Decorative gift card shapes */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-80 h-52 border-4 border-primary rounded-2xl rotate-6" />
          <div className="absolute w-80 h-52 border-4 border-white rounded-2xl -rotate-3" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/30 mb-6">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Gift Cards</h1>
          <p className="font-body text-background/70 text-lg leading-relaxed max-w-md mx-auto">
            Give the gift of an unforgettable dining experience at JTAP Kitchen. Perfect for every occasion.
          </p>
          <div className="mt-8 inline-flex items-center gap-6 px-8 py-4 bg-white/5 border border-white/15 rounded-2xl backdrop-blur-sm">
            {["$25", "$50", "$100", "$150+"].map(v => (
              <span key={v} className="font-heading text-lg font-bold text-primary">{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2">
        <div className="flex bg-muted rounded-full p-1 gap-1">
          <button
            onClick={() => setTab("buy")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-body text-sm font-semibold transition-all ${tab === "buy" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Gift className="w-4 h-4" /> Buy a Gift Card
          </button>
          <button
            onClick={() => setTab("check")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-body text-sm font-semibold transition-all ${tab === "check" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Search className="w-4 h-4" /> Check Balance
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
      {tab === "check" && (
        <motion.div key="check" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="max-w-md mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">Check Your Balance</h2>
            <p className="font-body text-sm text-muted-foreground">Enter your gift card code to see the remaining value.</p>
          </div>
          <form onSubmit={handleCheckBalance} className="space-y-4">
            <input
              value={checkCode}
              onChange={e => { setCheckCode(e.target.value); setCheckResult(null); }}
              placeholder="e.g. JTAP-ABC123"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="submit" disabled={checking}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {checking ? "Checking…" : "Check Balance"}
            </button>
          </form>
          {checkResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl p-6 border text-center ${checkResult.error ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/20"}`}>
              {checkResult.error ? (
                <p className="font-body text-sm text-destructive">{checkResult.error}</p>
              ) : (
                <>
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-1">Gift Card Code</p>
                  <p className="font-heading text-2xl font-bold text-primary tracking-widest mb-3">{checkResult.card.code}</p>
                  <div className="flex justify-around text-sm font-body">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Original Value</p>
                      <p className="font-semibold text-foreground">${checkResult.card.amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                      <p className={`font-semibold ${checkResult.card.status === "Active" ? "text-green-600" : checkResult.card.status === "Redeemed" ? "text-muted-foreground" : "text-amber-600"}`}>
                        {checkResult.card.status}
                      </p>
                    </div>
                    {checkResult.card.balance != null && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">Balance</p>
                        <p className="font-semibold text-foreground">${checkResult.card.balance?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {tab === "buy" && (
      <motion.div key="buy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Amount */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-4">Choose an Amount</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={`px-6 py-3 rounded-full font-body text-sm font-semibold border transition-all ${
                    amount === a && !customAmount
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10"
              placeholder="Custom amount (min $10)"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(null); }}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Purchaser */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-4">Your Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Your Name *</label>
                <input required value={form.purchaser_name} onChange={e => set("purchaser_name", e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Your Email *</label>
                <input required type="email" value={form.purchaser_email} onChange={e => set("purchaser_email", e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-4">Recipient (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Recipient Name</label>
                <input value={form.recipient_name} onChange={e => set("recipient_name", e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Recipient Email</label>
                <input type="email" value={form.recipient_email} onChange={e => set("recipient_email", e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Personal Message</label>
              <textarea rows={3} value={form.message} onChange={e => set("message", e.target.value)}
                placeholder="Add a heartfelt note..."
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? "Processing..." : `Order Gift Card — $${finalAmount || "?"}`}
          </button>
        </form>
      </div>
      </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}