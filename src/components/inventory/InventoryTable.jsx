import { Pencil, Trash2 } from "lucide-react";
import { STATUS_CONFIG } from "../../pages/InventoryManagement";

export default function InventoryTable({ forecast, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (forecast.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <p className="font-body text-muted-foreground">No inventory items yet. Add your first item to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {["Item", "Category", "Stock", "Min Level", "7-Day Forecast", "Days Left", "Status", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.map(item => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG["OK"];
                return (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-body text-sm font-medium">{item.name}</p>
                      {item.supplier && <p className="font-body text-xs text-muted-foreground">{item.supplier}</p>}
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-muted-foreground">{item.category}</td>
                    <td className="px-5 py-3 font-body text-sm font-semibold">
                      {item.current_stock} <span className="font-normal text-muted-foreground">{item.unit}</span>
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-muted-foreground">{item.min_stock_level} {item.unit}</td>
                    <td className="px-5 py-3 font-body text-sm">
                      {item.forecast_7d > 0
                        ? <span className="font-semibold">{item.forecast_7d} <span className="font-normal text-muted-foreground">{item.unit}</span></span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 font-body text-sm">
                      {item.days_of_stock_remaining !== null
                        ? <span className={item.days_of_stock_remaining <= 3 ? "text-red-600 font-semibold" : ""}>{item.days_of_stock_remaining}d</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => onEdit(item)} className="p-1.5 hover:text-primary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this item?")) onDelete(item.id); }}
                          className="p-1.5 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {forecast.map(item => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG["OK"];
          return (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div>
                <p className="font-body text-sm font-semibold">{item.name}</p>
                {item.supplier && <p className="font-body text-xs text-muted-foreground">{item.supplier}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">Category</p>
                  <p className="font-body text-sm">{item.category}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {item.status}
                  </span>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">Stock</p>
                  <p className="font-body text-sm font-semibold">{item.current_stock} {item.unit}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">Min Level</p>
                  <p className="font-body text-sm">{item.min_stock_level} {item.unit}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">7-Day Forecast</p>
                  <p className="font-body text-sm">{item.forecast_7d || "—"} {item.unit}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">Days Left</p>
                  <p className={`font-body text-sm ${item.days_of_stock_remaining <= 3 ? "text-red-600 font-semibold" : ""}`}>
                    {item.days_of_stock_remaining !== null ? `${item.days_of_stock_remaining}d` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => onEdit(item)} className="flex-1 py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-body text-xs font-medium flex items-center justify-center gap-1.5">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { if (confirm("Delete this item?")) onDelete(item.id); }} className="flex-1 py-2 px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-body text-xs font-medium flex items-center justify-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}