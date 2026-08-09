import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Send, Loader2, Check, X, Clock, User, ClipboardList, FolderOpen, Mail } from "lucide-react";
import { toast } from "sonner";
import InviteTemplateSelect from "@/components/companions/InviteTemplateSelect";
import BulkInviteInput from "@/components/companions/BulkInviteInput";
import SavedGroupsPicker from "@/components/companions/SavedGroupsPicker";
import OutlookContactsPicker from "@/components/companions/OutlookContactsPicker";
import { DEFAULT_TEMPLATE } from "@/lib/inviteTemplates";

const STATUS = {
  Attending: { icon: Check, color: "bg-green-100 text-green-700" },
  Declined: { icon: X, color: "bg-red-100 text-red-700" },
  Pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
};

const TABS = [
  { id: "single", label: "Single", icon: User },
  { id: "bulk", label: "Bulk Paste", icon: ClipboardList },
  { id: "group", label: "Saved Groups", icon: FolderOpen },
  { id: "outlook", label: "Outlook", icon: Mail },
];

export default function CompanionInviteForm({ confirmToken, reservationId, partySize = 2, adminMode = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [companions, setCompanions] = useState([]);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [tab, setTab] = useState("single");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  // single-tab fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const maxCompanions = Math.max(0, partySize - 1);
  const activeCount = companions.filter((c) => c.rsvp_status !== "Declined").length;
  const slotsFull = activeCount >= maxCompanions;
  const tabs = adminMode ? TABS : TABS.filter((t) => t.id !== "outlook");

  const loadCompanions = useCallback(async () => {
    try {
      const invites = await base44.entities.ReservationInvite.filter({ reservation_id: reservationId });
      setCompanions(invites);
    } catch {
      // ignore — not critical
    }
    setLoaded(true);
  }, [reservationId]);

  useEffect(() => { loadCompanions(); }, [loadCompanions]);

  const invoke = (payload) => base44.functions.invoke("sendCompanionInvite", { reservation_token: confirmToken, template, ...payload });

  const sendSingle = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email required");
      return;
    }
    setBusy(true);
    try {
      const res = await invoke({ name: name.trim(), email: email.trim() });
      if (res.data?.success) {
        toast.success(`Invite sent to ${name.trim()}`);
        setName(""); setEmail("");
        loadCompanions();
      } else {
        toast.error(res.data?.error || "Failed to send invite");
      }
    } catch {
      toast.error("Failed to send invite");
    }
    setBusy(false);
  };

  const sendBulk = async (contacts) => {
    if (!contacts.length) {
      toast.error("No valid contacts");
      return;
    }
    setBusy(true);
    try {
      const res = await invoke({ contacts });
      if (res.data?.success) {
        const s = res.data.sent?.length || 0;
        const k = res.data.skipped?.length || 0;
        toast.success(`Sent ${s} invite${s !== 1 ? "s" : ""}${k ? ` · ${k} skipped` : ""}`);
        queryClient.invalidateQueries({ queryKey: ["contact-groups", user?.email] });
        loadCompanions();
      } else {
        toast.error(res.data?.error || "Failed to send invites");
      }
    } catch {
      toast.error("Failed to send invites");
    }
    setBusy(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-left">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-base font-semibold">Invite Your Party</h3>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">
        Send RSVP links to your dining companions so they can confirm too.
        {partySize > 1 && <span className="text-muted-foreground/70"> (Up to {maxCompanions} for your party of {partySize})</span>}
      </p>

      {!slotsFull && <InviteTemplateSelect value={template} onChange={setTemplate} />}

      {/* Tabs */}
      {!slotsFull && (
        <div className="flex gap-1 mt-4 mb-3 border-b border-border">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-body font-medium border-b-2 transition-colors ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab content */}
      <div className={slotsFull ? "opacity-40 pointer-events-none" : ""}>
        {tab === "single" && (
          <form onSubmit={sendSingle} className="flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Companion name"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              type="email"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 justify-center"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Send className="w-3.5 h-3.5" /> Send</>)}
            </button>
          </form>
        )}
        {tab === "bulk" && <BulkInviteInput onSend={sendBulk} busy={busy} slotsFull={slotsFull} />}
        {tab === "group" && <SavedGroupsPicker onInvite={sendBulk} busy={busy} slotsFull={slotsFull} />}
        {tab === "outlook" && adminMode && <OutlookContactsPicker onSend={sendBulk} busy={busy} slotsFull={slotsFull} />}
      </div>

      {/* Invited companions */}
      {loaded && (
        <div className="mt-5">
          {companions.length > 0 ? (
            <div className="space-y-1.5">
              {companions.map((c) => {
                const cfg = STATUS[c.rsvp_status] || STATUS.Pending;
                const Icon = cfg.icon;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate">{c.guest_name}</p>
                      <p className="font-body text-xs text-muted-foreground truncate">{c.guest_email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {c.rsvp_status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="font-body text-xs text-muted-foreground text-center py-2">
              {slotsFull ? "All companion slots filled." : "No companions invited yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}