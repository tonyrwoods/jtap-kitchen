import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { UserPlus, Send, Mail, Check, Trash2, Users, FolderOpen, Crown } from "lucide-react";

export default function InviteeManager({ promotion }) {
  const [invitees, setInvitees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [groupPicker, setGroupPicker] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [importing, setImporting] = useState(false);
  const [loyaltyPicker, setLoyaltyPicker] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [importingLoyalty, setImportingLoyalty] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.EventInvite.filter({ promotion_id: promotion.id })
      .then(setInvitees)
      .finally(() => setLoading(false));
  }, [promotion.id]);

  useEffect(() => { load(); }, [load]);

  const { data: groups = [] } = useQuery({
    queryKey: ["all-contact-groups"],
    queryFn: () => base44.entities.ContactGroup.list("-created_date", 200),
  });

  const importGroup = async () => {
    if (!selectedGroup) { toast.error("Choose a group first"); return; }
    const group = groups.find((g) => g.id === selectedGroup);
    if (!group) return;
    const existing = new Set(invitees.map((i) => (i.guest_email || "").toLowerCase()));
    const records = (group.contacts || [])
      .filter((c) => c.email && !existing.has(c.email.toLowerCase()))
      .map((c) => ({
        promotion_id: promotion.id,
        promotion_title: promotion.title,
        guest_name: c.name || c.email.split("@")[0],
        guest_email: c.email.toLowerCase(),
        invite_token: crypto.randomUUID(),
        rsvp_status: "Pending",
        party_size: 1,
      }));
    if (records.length === 0) { toast.info("All group contacts are already invitees"); return; }
    setImporting(true);
    try {
      await base44.entities.EventInvite.bulkCreate(records);
      toast.success(`Imported ${records.length} from "${group.name}"`);
      setSelectedGroup(""); setGroupPicker(false);
      load();
    } catch { toast.error("Failed to import group"); }
    setImporting(false);
  };

  const importLoyaltyMembers = async () => {
    setImportingLoyalty(true);
    try {
      const members = await base44.entities.TapRoomMember.list("-created_date", 500);
      const existing = new Set(invitees.map((i) => (i.guest_email || "").toLowerCase()));
      const discount = parseFloat(discountAmount) || 0;
      const records = members
        .filter((m) => m.email && m.status !== "Inactive" && !existing.has(m.email.toLowerCase()))
        .map((m) => ({
          promotion_id: promotion.id,
          promotion_title: promotion.title,
          guest_name: m.guest_name,
          guest_email: m.email.toLowerCase(),
          invite_token: crypto.randomUUID(),
          rsvp_status: "Pending",
          party_size: 1,
          discount_amount: discount,
        }));
      if (records.length === 0) {
        toast.info("All loyalty members are already invitees");
      } else {
        await base44.entities.EventInvite.bulkCreate(records);
        toast.success(`Added ${records.length} loyalty member${records.length !== 1 ? "s" : ""}${discount > 0 ? ` ($${discount.toFixed(2)} discount each)` : ""}`);
        setLoyaltyPicker(false);
        load();
      }
    } catch {
      toast.error("Failed to import loyalty members");
    }
    setImportingLoyalty(false);
  };

  const addInvitee = async (e) => {
    e.preventDefault();
    if (!name || !email) { toast.error("Name and email required"); return; }
    setAdding(true);
    try {
      await base44.entities.EventInvite.create({
        promotion_id: promotion.id,
        promotion_title: promotion.title,
        guest_name: name,
        guest_email: email,
        invite_token: crypto.randomUUID(),
        rsvp_status: "Pending",
        party_size: 1,
      });
      setName(""); setEmail("");
      toast.success("Invitee added");
      load();
    } catch { toast.error("Failed to add invitee"); }
    setAdding(false);
  };

  const addBulk = async () => {
    const lines = bulkText.trim().split("\n").filter(Boolean);
    if (lines.length === 0) { toast.error("Paste at least one line"); return; }
    const records = [];
    const skipped = [];
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        records.push({
          promotion_id: promotion.id,
          promotion_title: promotion.title,
          guest_name: parts[0],
          guest_email: parts[1],
          invite_token: crypto.randomUUID(),
          rsvp_status: "Pending",
          party_size: 1,
        });
      } else {
        skipped.push(line);
      }
    }
    if (records.length === 0) { toast.error("No valid entries. Use: Name, Email per line"); return; }
    setAdding(true);
    try {
      await base44.entities.EventInvite.bulkCreate(records);
      toast.success(`${records.length} invitee${records.length !== 1 ? "s" : ""} added${skipped.length ? `, ${skipped.length} skipped` : ""}`);
      setBulkText(""); setShowBulk(false);
      load();
    } catch { toast.error("Failed to add invitees"); }
    setAdding(false);
  };

  const sendInvite = async (invitee) => {
    try {
      const res = await base44.functions.invoke("sendEventInvite", { promotion_id: promotion.id, invite_id: invitee.id });
      if (res.data?.sent > 0) { toast.success(`Invite sent to ${invitee.guest_name}`); }
      else if (res.data?.errors?.length) { toast.error(`Failed: ${res.data.errors[0].error}`); }
      else { toast.info("Invite already sent or no change"); }
      load();
    } catch { toast.error("Failed to send invite"); }
  };

  const sendAll = async () => {
    const unsent = invitees.filter((i) => !i.invite_sent_at);
    if (unsent.length === 0) { toast.info("All invites already sent"); return; }
    setSendingAll(true);
    try {
      const res = await base44.functions.invoke("sendEventInvite", { promotion_id: promotion.id, send_to_all: true });
      toast.success(`${res.data?.sent || 0} invite${(res.data?.sent || 0) !== 1 ? "s" : ""} sent`);
      load();
    } catch { toast.error("Failed to send invites"); }
    setSendingAll(false);
  };

  const removeInvitee = async (invitee) => {
    if (!confirm(`Remove ${invitee.guest_name}?`)) return;
    await base44.entities.EventInvite.delete(invitee.id);
    toast.success("Invitee removed");
    load();
  };

  const sentCount = invitees.filter((i) => i.invite_sent_at).length;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-heading text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Invitees</h4>
          <p className="font-body text-xs text-muted-foreground mt-0.5">{invitees.length} total · {sentCount} invited · {invitees.length - sentCount} pending</p>
        </div>
        <button onClick={sendAll} disabled={sendingAll || invitees.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          <Send className="w-3.5 h-3.5" /> {sendingAll ? "Sending..." : "Send All"}
        </button>
      </div>

      {!showBulk ? (
        <form onSubmit={addInvitee} className="flex gap-2 mb-3">
          <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" />
          <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
          <button type="submit" disabled={adding} className="px-4 py-2 bg-foreground text-background rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <UserPlus className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="mb-3 space-y-2">
          <textarea rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none font-mono" value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Name, Email\nJane Doe, jane@example.com\nJohn Smith, john@example.com"} />
          <div className="flex gap-2">
            <button onClick={addBulk} disabled={adding} className="px-4 py-2 bg-foreground text-background rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">{adding ? "Adding..." : "Add All"}</button>
            <button onClick={() => { setShowBulk(false); setBulkText(""); }} className="px-4 py-2 border border-border rounded-lg font-body text-sm">Cancel</button>
          </div>
        </div>
      )}
      <button onClick={() => setShowBulk(!showBulk)} className="text-xs text-primary hover:underline mb-3">{showBulk ? "← Single add" : "Bulk add (paste list)"}</button>

      <button onClick={() => setGroupPicker(!groupPicker)} className="text-xs text-primary hover:underline mb-3 ml-2 inline-flex items-center gap-1"><FolderOpen className="w-3 h-3" /> {groupPicker ? "← Hide groups" : "Import saved group"}</button>

      <button onClick={() => setLoyaltyPicker(!loyaltyPicker)} className="text-xs text-primary hover:underline mb-3 ml-2 inline-flex items-center gap-1"><Crown className="w-3 h-3" /> {loyaltyPicker ? "← Hide" : "Add all loyalty members"}</button>
      {loyaltyPicker && (
        <div className="mb-3 p-3 rounded-lg bg-muted/40 border border-border space-y-2">
          <label className="font-body text-xs text-muted-foreground block">Discount amount per guest ($ off the regular price)</label>
          <div className="flex gap-2">
            <input type="number" step="0.01" min="0" className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-background font-body" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0.00" />
            <button onClick={importLoyaltyMembers} disabled={importingLoyalty} className="px-4 py-1.5 bg-foreground text-background rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5">
              {importingLoyalty ? "Importing…" : "Add All Members"}
            </button>
          </div>
          <p className="font-body text-xs text-muted-foreground">Adds every active Tap Room member as a pending invitee. Duplicates are skipped.</p>
        </div>
      )}
      {groupPicker && (
        <div className="flex gap-2 mb-3 p-3 rounded-lg bg-muted/40 border border-border">
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background font-body">
            <option value="">Choose a saved group…</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.contacts?.length || 0})</option>)}
          </select>
          <button onClick={importGroup} disabled={importing || !selectedGroup} className="px-3 py-1.5 bg-foreground text-background rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : invitees.length === 0 ? (
        <p className="text-center py-8 font-body text-sm text-muted-foreground">No invitees yet. Add guests above to start sending invites.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {invitees.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border">
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium truncate">{inv.guest_name}</p>
                <p className="font-body text-xs text-muted-foreground truncate">{inv.guest_email}</p>
              </div>
              {inv.invite_sent_at ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium shrink-0"><Check className="w-3 h-3" /> Sent</span>
              ) : (
                <button onClick={() => sendInvite(inv)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary shrink-0">
                  <Mail className="w-3 h-3" /> Send
                </button>
              )}
              <button onClick={() => removeInvitee(inv)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}