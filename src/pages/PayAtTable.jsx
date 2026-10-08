import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CreditCard, Loader2, Receipt, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import useSeoMeta from "../hooks/useSeoMeta";

export default function PayAtTable() {
  useSeoMeta("pay-at-table");
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get("table") || "";

  const [tableNumber, setTableNumber] = useState(tableParam);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [entered, setEntered] = useState(!!tableParam);

  const loadBill = async (table) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getTableBill", { table_number: Number(table) });
      if (res.data?.error) {
        toast.error(res.data.error);
        setBill(null);
      } else {
        setBill(res.data);
      }
    } catch {
      toast.error("Could not load your bill");
      setBill(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tableParam) loadBill(tableParam);
  }, [tableParam]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await base44.functions.invoke("create-table-payment-checkout", {
        table_number: Number(tableNumber),
      });
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        toast.error(res.data?.error || "Could not start payment");
        setPaying(false);
      }
    } catch {
      toast.error("Could not start payment");
      setPaying(false);
    }
  };

  const taxRate = bill?.tax_rate || 9.25;
  const taxAmount = bill ? (bill.subtotal * taxRate) / 100 : 0;
  const total = bill ? bill.subtotal + taxAmount : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="font-body text-xs uppercase tracking-widest text-primary font-semibold mb-1">JTAP Kitchen</p>
          <h1 className="font-heading text-2xl font-bold">Pay Your Bill</h1>
        </div>

        {!entered ? (
          /* Table number entry */
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <p className="font-body text-sm text-muted-foreground text-center">
              Enter your table number to view and pay your bill.
            </p>
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Table Number</label>
              <input
                type="number"
                inputMode="numeric"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 5"
                className="w-full border border-border rounded-lg px-4 py-3 text-lg text-center font-heading font-bold bg-background"
              />
            </div>
            <button
              onClick={() => { setEntered(true); loadBill(tableNumber); }}
              disabled={!tableNumber || loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              View Bill
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : !bill || bill.items.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold mb-1">No Outstanding Balance</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              {bill ? "All orders at this table have been paid." : "Could not find any orders for this table."}
            </p>
            <button
              onClick={() => { setEntered(false); setBill(null); }}
              className="px-6 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted"
            >
              Try Another Table
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Bill summary */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-primary/5 px-5 py-4 flex items-center gap-3 border-b border-border">
                <Receipt className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-heading text-sm font-semibold">Table {bill.table_number}</p>
                  <p className="font-body text-xs text-muted-foreground">{bill.order_count} order{bill.order_count !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="px-5 py-4 space-y-2">
                {bill.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-body font-medium">{item.quantity}× {item.name}</span>
                    </div>
                    <span className="font-body font-medium ml-3">${item.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-border px-5 py-4 space-y-1.5">
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-heading text-lg font-bold pt-1.5 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {paying ? "Starting checkout…" : `Pay $${total.toFixed(2)} Now`}
            </button>

            <button
              onClick={() => { setEntered(false); setBill(null); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 font-body text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Use a different table
            </button>

            <p className="text-center font-body text-xs text-muted-foreground">
              You'll be redirected to our secure payment partner to complete your payment.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}