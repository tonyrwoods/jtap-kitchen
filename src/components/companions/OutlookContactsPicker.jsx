import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function OutlookContactsPicker({ onSend, busy, slotsFull }) {
  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await base44.functions.invoke("getOutlookContacts", {});
      if (res.data?.contacts) { setContacts(res.data.contacts); setSelected(new Set()); }
      else setError(res.data?.error || "Failed to load contacts");
    } catch {
      setError("Failed to load Outlook contacts");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = (contacts || []).filter((c) =>
    !query || `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (email) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      return next;
    });
  };

  const send = () => {
    const picks = (contacts || []).filter((c) => selected.has(c.email));
    if (!picks.length) { toast.error("Select at least one contact"); return; }
    onSend(picks);
    setSelected(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Outlook contacts…"
            className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm bg-background font-body"
          />
        </div>
        <button type="button" onClick={load} disabled={loading} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && <p className="font-body text-xs text-destructive">{error}</p>}

      {contacts && (
        <>
          <div className={`max-h-52 overflow-y-auto space-y-1 border border-border rounded-lg p-1.5 ${slotsFull ? "opacity-40 pointer-events-none" : ""}`}>
            {filtered.length === 0 ? (
              <p className="font-body text-xs text-muted-foreground text-center py-4">No contacts found</p>
            ) : filtered.map((c) => {
              const checked = selected.has(c.email);
              return (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => toggle(c.email)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-body transition-colors ${checked ? "bg-primary/10" : "hover:bg-muted"}`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                    {checked && <span className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{c.name || c.email}</span>
                    {c.name && <span className="block text-xs text-muted-foreground truncate">{c.email}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-muted-foreground">{selected.size} selected</span>
            <button
              type="button"
              onClick={send}
              disabled={busy || selected.size === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send Invites</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}