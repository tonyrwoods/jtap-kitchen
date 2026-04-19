import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Gift, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const AMOUNTS = [25, 50, 100, 150, 200];

function generateCode() {
  return "JTAP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function GiftCards() {
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
      const code = generateCode();
      const card = await base44.entities.GiftCard.create({
        ...form,
        amount: finalAmount,
        code,
        status: "Pending Payment",
      });

      // Send email with gift card code
      await base44.functions.invoke('sendGiftCardEmail', {
        giftCard: {
          id: card.id,
          code,
          amount: finalAmount,
          purchaser_name: form.purchaser_name,
          purchaser_email: form.purchaser_email,
          recipient_name: form.recipient_name,
          recipient_email: form.recipient_email,
          message: form.message,
        }
      });

      toast.success("Gift card created! Email sent to recipient.");
      setSuccess({ code, amount: finalAmount });
    } catch (error) {
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
            To complete your purchase, please call us at <span className="text-foreground font-medium">+1 (212) 555-0198</span> or email <span className="text-foreground font-medium">hello@aurelian.com</span> with your voucher code.
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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Gift Cards</h1>
          <p className="font-body text-background/70 text-lg leading-relaxed">
            Give the gift of an unforgettable dining experience at JTAP Kitchen.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-16">
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
    </div>
  );
}