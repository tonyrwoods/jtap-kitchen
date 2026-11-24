import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { ShoppingBag, Phone, CreditCard, CheckCircle2, XCircle } from "lucide-react";

const STATUS_OPTIONS = ["Pending Payment", "New", "Preparing", "Ready", "Served"];

const STATUS_STYLES = {
  "Pending Payment": "bg-amber-100 text-amber-800",
  New: "bg-blue-100 text-blue-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-green-100 text-green-800",
  Served: "bg-muted text-muted-foreground",
};

export default function OrderCard({ order, onChanged }) {
  const items = order.items || [];
  const total = items.reduce(
    (sum, i) => sum + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0),
    0
  );
  const paid = order.payment_status === "paid";
  const isTakeout = order.order_type === "takeout";
  const who = order.pickup_name || order.customer_name || order.server_name || "Guest";

  const handleStatus = async (status) => {
    await base44.entities.Order.update(order.id, { status });
    toast.success(`Order moved to ${status}`);
    onChanged();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isTakeout ? (
              <span className="inline-flex items-center gap-1.5 font-body font-semibold text-sm">
                <ShoppingBag className="w-3.5 h-3.5 text-primary" /> {who}
              </span>
            ) : (
              <span className="font-body font-semibold text-sm">Table {order.table_number}</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[order.status] || "bg-muted text-muted-foreground"}`}>
              {order.status}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {paid ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
              {paid ? "Paid" : "Unpaid"}
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {isTakeout ? "Takeout" : "Dine-in"} · {new Date(order.created_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            {order.pickup_phone && (
              <span className="inline-flex items-center gap-1 ml-2"><Phone className="w-3 h-3" /> {order.pickup_phone}</span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-heading font-bold text-lg">${total.toFixed(2)}</p>
          <p className="font-body text-[10px] text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="font-body text-xs text-muted-foreground flex justify-between gap-3">
            <span>{item.quantity}× {item.name}{item.notes ? ` — ${item.notes}` : ""}</span>
            <span className="shrink-0">${((Number(item.unit_price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {order.notes && <p className="font-body text-xs italic text-primary mt-2">"{order.notes}"</p>}

      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
        <span className="inline-flex items-center gap-1 font-body text-[10px] text-muted-foreground">
          <CreditCard className="w-3 h-3" /> {paid ? "Payment received" : "Awaiting payment"}
        </span>
        <select
          value={order.status}
          onChange={(e) => handleStatus(e.target.value)}
          className="border border-border rounded-lg px-2 py-1 font-body text-xs bg-background"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}