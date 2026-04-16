import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Minus, Trash2, Tag, Printer, CheckCircle, ArrowLeft, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import CustomerLoyaltyPanel from "../components/checkout/CustomerLoyaltyPanel";

const TAX_RATE = 9.25; // %

function calcCustomerTier(totalSpend) {
  if (totalSpend >= 5000) return "Platinum";
  if (totalSpend >= 1500) return "Gold";
  if (totalSpend >= 500)  return "Silver";
  return "Bronze";
}

function genReceiptNumber() {
  return "RCP-" + Date.now().toString(36).toUpperCase();
}

// ── Receipt Print View ──────────────────────────────────────────────────────
function ReceiptView({ invoice, onClose, onPrint }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* Receipt */}
        <div id="receipt-print" className="p-6 font-mono text-xs text-gray-800">
          <div className="text-center mb-4">
            <p className="font-sans font-bold text-lg tracking-widest text-gray-900">JTAP KITCHEN</p>
            <p className="text-gray-500 text-[10px]">Memphis, TN · 901-233-4060</p>
            <div className="border-t border-dashed border-gray-300 my-3" />
            <p className="font-sans font-semibold text-sm">RECEIPT</p>
            <p className="text-gray-500">{invoice.receipt_number}</p>
          </div>

          <div className="flex justify-between mb-1 text-[10px] text-gray-500">
            <span>Table {invoice.table_number}{invoice.server_name ? ` · ${invoice.server_name}` : ""}</span>
            <span>{new Date(invoice.created_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {invoice.items.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span>{item.quantity}x {item.name}</span>
              <span>${item.line_total.toFixed(2)}</span>
            </div>
          ))}

          <div className="border-t border-dashed border-gray-300 my-2" />

          <div className="space-y-0.5">
            <div className="flex justify-between"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount{invoice.discount_type === "Percent" ? ` (${invoice.discount_value}%)` : ""}</span>
                <span>-${invoice.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between"><span>Tax ({TAX_RATE}%)</span><span>${invoice.tax_amount.toFixed(2)}</span></div>
          </div>

          <div className="border-t border-gray-400 my-2" />
          <div className="flex justify-between font-sans font-bold text-base">
            <span>TOTAL</span><span>${invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Payment</span><span>{invoice.payment_method}</span>
          </div>

          <div className="text-center mt-4 text-[10px] text-gray-400">
            <p>Thank you for dining with us!</p>
            <p>jtapkitchen.com</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onPrint} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-full font-sans text-sm font-medium">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-full font-sans text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Menu Item Card ───────────────────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${qty > 0 ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/30"}`}>
      <div className="flex-1 min-w-0 mr-3">
        <p className="font-body text-sm font-medium truncate">{item.name}</p>
        <p className="font-body text-xs text-muted-foreground">{item.category}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-heading text-sm font-semibold">${Number(item.price).toFixed(2)}</span>
        {qty > 0 ? (
          <div className="flex items-center gap-1">
            <button onClick={onRemove} className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary">
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center font-body text-sm font-semibold">{qty}</span>
            <button onClick={onAdd} className="w-6 h-6 rounded-full bg-primary text-white hover:opacity-80 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button onClick={onAdd} className="w-7 h-7 rounded-full bg-primary text-white hover:opacity-80 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Starters", "Mains", "Desserts", "Drinks"];

export default function Checkout() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [quantities, setQuantities] = useState({}); // { menuItemId: qty }
  const [tableNumber, setTableNumber] = useState("");
  const [serverName, setServerName] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState("None");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [notes, setNotes] = useState("");

  // Customer
  const [linkedCustomer, setLinkedCustomer] = useState(null);

  // Receipt
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.MenuItem.list("name", 200),
      base44.entities.Order.list("-created_date", 100),
    ]).then(([m, o]) => { setMenuItems(m); setOrders(o); setLoading(false); });
  }, []);

  const addQty  = (id) => setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const subQty  = (id) => setQuantities(q => { const n = (q[id] || 0) - 1; if (n <= 0) { const c = { ...q }; delete c[id]; return c; } return { ...q, [id]: n }; });

  // Calculations
  const selectedItems = menuItems.filter(m => quantities[m.id] > 0);
  const subtotal = selectedItems.reduce((sum, m) => sum + m.price * quantities[m.id], 0);
  const discountAmount = (() => {
    if (discountType === "Percent") return Math.min(subtotal, subtotal * (parseFloat(discountValue) || 0) / 100);
    if (discountType === "Fixed")   return Math.min(subtotal, parseFloat(discountValue) || 0);
    return 0;
  })();
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * TAX_RATE / 100;
  const total = afterDiscount + taxAmount;

  const filteredMenu = menuItems.filter(m => {
    const matchCat = category === "All" || m.category === category;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleGenerateReceipt = async () => {
    if (selectedItems.length === 0) { toast.error("Add at least one item"); return; }
    if (!tableNumber) { toast.error("Enter a table number"); return; }
    setSaving(true);

    const lineItems = selectedItems.map(m => ({
      menu_item_id: m.id,
      name: m.name,
      category: m.category,
      unit_price: m.price,
      quantity: quantities[m.id],
      line_total: m.price * quantities[m.id],
    }));

    const invoiceData = {
      receipt_number: genReceiptNumber(),
      order_id: linkedOrderId || undefined,
      table_number: Number(tableNumber),
      server_name: serverName,
      items: lineItems,
      subtotal,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      discount_amount: discountAmount,
      tax_rate: TAX_RATE,
      tax_amount: taxAmount,
      total,
      status: "Paid",
      payment_method: paymentMethod,
      notes,
    };

    const saved = await base44.entities.Invoice.create(invoiceData);

    // Update customer profile if linked
    if (linkedCustomer) {
      const pointsEarned = Math.floor(total);
      const newHistory = [
        ...(linkedCustomer.order_history || []),
        {
          invoice_id: saved.id,
          receipt_number: saved.receipt_number,
          date: new Date().toISOString(),
          total,
          items_count: selectedItems.length,
        },
      ];
      const newSpend = (linkedCustomer.total_spend || 0) + total;
      const newVisits = (linkedCustomer.total_visits || 0) + 1;
      const newPoints = (linkedCustomer.loyalty_points || 0) + pointsEarned;
      const newTier = calcCustomerTier(newSpend);
      await base44.entities.CustomerProfile.update(linkedCustomer.id, {
        total_spend: newSpend,
        total_visits: newVisits,
        loyalty_points: newPoints,
        loyalty_tier: newTier,
        order_history: newHistory,
      });
    }

    setReceipt(saved);
    setSaving(false);
    toast.success("Invoice created!");
  };

  const handlePrint = () => {
    const el = document.getElementById("receipt-print");
    if (!el) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;margin:0;padding:16px;}*{box-sizing:border-box;}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  const resetAll = () => {
    setQuantities({}); setTableNumber(""); setServerName(""); setLinkedOrderId("");
    setDiscountType("None"); setDiscountValue(""); setNotes(""); setReceipt(null);
    setLinkedCustomer(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Checkout</h1>
            <p className="font-body text-xs text-muted-foreground">Build an order · apply discounts · print receipt</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={resetAll} className="font-body text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> New Order
          </button>
          <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Menu Browser ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Filters */}
          <div className="px-5 pt-4 pb-3 space-y-3 border-b border-border bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-border rounded-full text-sm bg-background font-body"
                placeholder="Search dishes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full font-body text-xs font-medium whitespace-nowrap transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start">
            {filteredMenu.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={quantities[item.id] || 0}
                onAdd={() => addQty(item.id)}
                onRemove={() => subQty(item.id)}
              />
            ))}
            {filteredMenu.length === 0 && (
              <p className="col-span-2 text-center font-body text-sm text-muted-foreground py-16">No items found</p>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="w-80 shrink-0 flex flex-col bg-card overflow-y-auto">
          <div className="p-5 space-y-5 flex-1">
            {/* Customer Loyalty */}
            <CustomerLoyaltyPanel
              onCustomerLinked={setLinkedCustomer}
              orderTotal={total}
            />

            {/* Table / Server */}
            <div>
              <h3 className="font-heading text-sm font-semibold mb-3">Order Info</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Table # *</label>
                    <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. 5" />
                  </div>
                  <div className="flex-1">
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Server</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={serverName} onChange={e => setServerName(e.target.value)} placeholder="Name" />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Link to Order (optional)</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={linkedOrderId} onChange={e => setLinkedOrderId(e.target.value)}>
                    <option value="">— None —</option>
                    {orders.filter(o => o.status !== "Served").map(o => (
                      <option key={o.id} value={o.id}>Table {o.table_number} · {o.status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <h3 className="font-heading text-sm font-semibold mb-3">Selected Items</h3>
              {selectedItems.length === 0 ? (
                <p className="font-body text-xs text-muted-foreground py-4 text-center">No items added yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-xs font-medium truncate">{item.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{quantities[item.id]} × ${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-body text-xs font-semibold">${(item.price * quantities[item.id]).toFixed(2)}</span>
                        <button onClick={() => { const q = { ...quantities }; delete q[item.id]; setQuantities(q); }} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold">Discount</h3>
              </div>
              <div className="flex gap-2 mb-2">
                {["None", "Percent", "Fixed"].map(t => (
                  <button key={t} onClick={() => { setDiscountType(t); setDiscountValue(""); }}
                    className={`flex-1 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${discountType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {t === "Percent" ? "%" : t === "Fixed" ? "$" : "None"}
                  </button>
                ))}
              </div>
              {discountType !== "None" && (
                <input
                  type="number"
                  min="0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                  placeholder={discountType === "Percent" ? "e.g. 10 for 10%" : "e.g. 5.00"}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              )}
            </div>

            {/* Payment method */}
            <div>
              <label className="font-body text-xs text-muted-foreground mb-2 block">Payment Method</label>
              <div className="flex gap-2">
                {["Cash", "Card", "Other"].map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${paymentMethod === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Notes</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Comp'd appetizer" />
            </div>
          </div>

          {/* Totals + CTA */}
          <div className="border-t border-border p-5 space-y-3 bg-card">
            <div className="space-y-1.5 font-body text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount{discountType === "Percent" ? ` (${discountValue}%)` : ""}</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({TAX_RATE}%)</span><span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-heading font-bold text-lg pt-1 border-t border-border">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleGenerateReceipt}
              disabled={saving || selectedItems.length === 0}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? "Generating…" : "Generate Receipt"}
            </button>
          </div>
        </div>
      </div>

      {receipt && (
        <ReceiptView
          invoice={receipt}
          onClose={() => setReceipt(null)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}