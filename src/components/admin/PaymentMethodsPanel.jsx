import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Star, CreditCard, Building2, X } from "lucide-react";
import { toast } from "sonner";

const TYPE_ICONS = {
  "Bank Account": Building2,
  "Credit Card": CreditCard,
  "Debit Card": CreditCard,
};

const TYPE_COLORS = {
  "Bank Account": "bg-blue-100 text-blue-700",
  "Credit Card": "bg-purple-100 text-purple-700",
  "Debit Card": "bg-green-100 text-green-700",
};

function AddMethodModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nickname: "",
    type: "Bank Account",
    bank_name: "",
    account_last4: "",
    routing_number_last4: "",
    account_holder: "",
    is_default: false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.account_last4.length !== 4 || !/^\d+$/.test(form.account_last4)) {
      toast.error("Account last 4 digits must be exactly 4 numbers");
      return;
    }
    setSaving(true);
    await base44.entities.PaymentMethod.create(form);
    toast.success("Payment method added");
    onSave();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Link Payment Method</h3>
          <button type="button" onClick={onClose} className="p-1 hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="font-body text-sm text-muted-foreground mb-1 block">Type *</label>
            <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              value={form.type} onChange={e => set("type", e.target.value)}>
              <option>Bank Account</option>
              <option>Credit Card</option>
              <option>Debit Card</option>
            </select>
          </div>

          <div>
            <label className="font-body text-sm text-muted-foreground mb-1 block">Nickname *</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              placeholder="e.g. Main Checking, Visa Rewards"
              value={form.nickname} onChange={e => set("nickname", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">
                {form.type === "Bank Account" ? "Bank Name" : "Card Issuer"} *
              </label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                placeholder="e.g. Chase, Bank of America"
                value={form.bank_name} onChange={e => set("bank_name", e.target.value)} required />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Last 4 Digits *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                placeholder="1234" maxLength={4}
                value={form.account_last4} onChange={e => set("account_last4", e.target.value.replace(/\D/g, ""))} required />
            </div>
          </div>

          {form.type === "Bank Account" && (
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Routing # Last 4</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                placeholder="5678" maxLength={4}
                value={form.routing_number_last4} onChange={e => set("routing_number_last4", e.target.value.replace(/\D/g, ""))} />
            </div>
          )}

          <div>
            <label className="font-body text-sm text-muted-foreground mb-1 block">Account Holder Name</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
              placeholder="JTAP Kitchen LLC"
              value={form.account_holder} onChange={e => set("account_holder", e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_default" checked={form.is_default}
              onChange={e => set("is_default", e.target.checked)} className="rounded" />
            <label htmlFor="is_default" className="font-body text-sm">Set as default payment method</label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Link Account"}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-full font-body text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PaymentMethodsPanel({ onMethodsChange }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchMethods = async () => {
    const data = await base44.entities.PaymentMethod.filter({ is_active: true });
    setMethods(data);
    setLoading(false);
    if (onMethodsChange) onMethodsChange(data);
  };

  useEffect(() => { fetchMethods(); }, []);

  const setDefault = async (id) => {
    // Clear all defaults, then set this one
    await Promise.all(methods.map(m => base44.entities.PaymentMethod.update(m.id, { is_default: m.id === id })));
    setMethods(prev => prev.map(m => ({ ...m, is_default: m.id === id })));
    toast.success("Default payment method updated");
  };

  const remove = async (id) => {
    await base44.entities.PaymentMethod.update(id, { is_active: false });
    setMethods(prev => prev.filter(m => m.id !== id));
    if (onMethodsChange) onMethodsChange(methods.filter(m => m.id !== id));
    toast.success("Payment method removed");
  };

  if (loading) return <div className="h-16 flex items-center justify-center"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold">Payment Methods</h3>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Linked accounts used for vendor payments</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
          <Plus className="w-4 h-4" /> Link Account
        </button>
      </div>

      {methods.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-body text-sm text-muted-foreground">No payment methods linked yet.</p>
          <button onClick={() => setShowAdd(true)} className="font-body text-sm text-primary hover:underline mt-1">
            Link your first account →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map(method => {
            const Icon = TYPE_ICONS[method.type] || CreditCard;
            return (
              <div key={method.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                method.is_default ? "border-primary/40 bg-primary/5" : "border-border bg-background"
              }`}>
                <div className={`p-2 rounded-lg ${TYPE_COLORS[method.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-semibold truncate">{method.nickname}</p>
                    {method.is_default && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold shrink-0">
                        <Star className="w-2.5 h-2.5" /> Default
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {method.bank_name} · {method.type} ···· {method.account_last4}
                    {method.account_holder && ` · ${method.account_holder}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!method.is_default && (
                    <button onClick={() => setDefault(method.id)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Set as default">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => remove(method.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddMethodModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchMethods(); }}
        />
      )}
    </div>
  );
}