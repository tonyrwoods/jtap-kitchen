import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ShoppingBag } from "lucide-react";
import OrderCard from "./OrderCard";

const FILTERS = ["All", "New", "Preparing", "Ready", "Served", "Abandoned"];

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    base44.entities.Order.list("-created_date", 200)
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const matches = orders.filter((o) => {
    if (filter === "Abandoned") {
      if (o.status !== "Pending Payment") return false;
    } else if (filter !== "All" && o.status !== filter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const hay = [
      o.pickup_name, o.customer_name, o.server_name, o.pickup_phone,
      String(o.table_number ?? ""), ...(o.items || []).map((i) => i.name),
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });

  if (loading) {
    return <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">Online Orders</h3>
        <p className="font-body text-sm text-muted-foreground">
          Every order placed from the website and table QR menus, including takeout carts that were never paid.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, dish…"
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 font-body text-sm bg-background"
          />
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No orders match this view.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {matches.map((o) => <OrderCard key={o.id} order={o} onChanged={load} />)}
        </div>
      )}
    </div>
  );
}