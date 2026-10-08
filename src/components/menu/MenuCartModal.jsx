import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Loader2, UtensilsCrossed, Store } from "lucide-react";
import { toast } from "sonner";

export default function MenuCartModal({
  items,
  quantities,
  notes,
  tableNumber,
  onClose,
  onUpdateQty,
  onUpdateNotes,
  onClear,
}) {
  const [mode, setMode] = useState("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [tableNum, setTableNum] = useState(tableNumber || "");
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  const selectedItems = items.filter((i) => quantities[i.id] > 0);
  const total = selectedItems.reduce((sum, i) => sum + i.price * quantities[i.id], 0);
  const itemCount = selectedItems.reduce((sum, i) => sum + quantities[i.id], 0);

  const handlePlaceOrder = async () => {
    if (mode === "dine_in" && !tableNum) {
      toast.error("Please enter your table number");
      return;
    }
    if (mode === "takeout") {
      if (!pickupName.trim()) { toast.error("Please enter your name"); return; }
      if (!pickupPhone.trim()) { toast.error("Please enter your phone number"); return; }
    }
    if (selectedItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setPlacing(true);
    try {
      const orderItems = selectedItems.map((i) => ({
        menu_item_id: i.id,
        quantity: quantities[i.id],
        notes: notes[i.id] || "",
      }));

      const orderRes = await base44.functions.invoke("submitMenuOrder", {
        table_number: mode === "dine_in" ? Number(tableNum) : null,
        items: orderItems,
        customer_name: customerName,
        notes: orderNotes,
        order_type: mode,
        pickup_name: mode === "takeout" ? pickupName : undefined,
        pickup_phone: mode === "takeout" ? pickupPhone : undefined,
      });

      if (!orderRes.data?.success) {
        toast.error(orderRes.data?.error || "Could not place order");
        setPlacing(false);
        return;
      }

      if (mode === "takeout") {
        const checkoutRes = await base44.functions.invoke("create-takeout-checkout", {
          orderId: orderRes.data.order_id,
        });
        if (checkoutRes.data?.redirectUrl) {
          window.location.href = checkoutRes.data.redirectUrl;
          return;
        }
        toast.error("Could not start payment. Your order was placed but not paid.");
      } else {
        setPlaced(orderRes.data.order_id || "confirmed");
        onClear();
        toast.success("Order sent to the kitchen!");
      }
    } catch (err) {
      toast.error("Could not place order: " + (err.message || "unknown error"));
    }
    setPlacing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Your Order</h2>
            {itemCount > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{itemCount}</span>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors" aria-label="Close cart"><X className="w-5 h-5" /></button>
        </div>

        {!placed && (
          <div className="flex gap-1 p-3 bg-muted/30 border-b border-border">
            <button onClick={() => setMode("dine_in")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${mode === "dine_in" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <UtensilsCrossed className="w-4 h-4" /> Dine In
            </button>
            <button onClick={() => setMode("takeout")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${mode === "takeout" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <Store className="w-4 h-4" /> Takeout
            </button>
          </div>
        )}

        {placed ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-9 h-9 text-green-600" /></div>
            <h3 className="font-heading text-xl font-bold mb-2">Order Sent!</h3>
            <p className="font-body text-sm text-muted-foreground mb-1">Your order for Table {tableNum} has been sent to the kitchen.</p>
            <p className="font-body text-xs text-muted-foreground mb-6">Your server will bring it out shortly.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90">Done</button>
          </div>
        ) : selectedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-body text-sm text-muted-foreground">Your cart is empty.</p>
            <p className="font-body text-xs text-muted-foreground mt-1">Add items from the menu to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selectedItems.map((item) => (
                <div key={item.id} className="border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium leading-tight">{item.name}</p>
                      <p className="font-body text-xs text-muted-foreground">${Number(item.price).toFixed(2)} each</p>
                    </div>
                    <span className="font-heading text-sm font-semibold shrink-0">${(item.price * quantities[item.id]).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateQty(item.id, quantities[item.id] - 1)} className="w-7 h-7 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center" aria-label="Decrease quantity"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="font-body text-sm font-semibold w-6 text-center">{quantities[item.id]}</span>
                      <button onClick={() => onUpdateQty(item.id, quantities[item.id] + 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center" aria-label="Increase quantity"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => onUpdateQty(item.id, 0)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove item"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <input className="w-full mt-2 border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background font-body" placeholder="Notes (e.g. no onions, extra sauce)" value={notes[item.id] || ""} onChange={(e) => onUpdateNotes(item.id, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="border-t border-border px-5 py-4 space-y-3 shrink-0 bg-card rounded-b-3xl">
              {mode === "dine_in" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Table #</label>
                    <input type="number" inputMode="numeric" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={tableNum} onChange={(e) => setTableNum(e.target.value)} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Name (optional)</label>
                    <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Pickup Name *</label>
                      <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={pickupName} onChange={(e) => setPickupName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="font-body text-xs text-muted-foreground mb-1 block">Phone *</label>
                      <input type="tel" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Name (optional)</label>
                    <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
                  </div>
                </div>
              )}
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" placeholder="Order notes (optional)" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">Total</span>
                <span className="font-heading text-xl font-bold">${total.toFixed(2)}</span>
              </div>
              <button onClick={handlePlaceOrder} disabled={placing} className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {placing ? "Processing…" : mode === "takeout" ? "Pay & Place Order" : "Place Order"}
              </button>
              {mode === "takeout" && <p className="text-center font-body text-xs text-muted-foreground">You'll be redirected to secure checkout to pay for your order.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}