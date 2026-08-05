import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { FolderOpen, Users, Plus, Trash2, Pencil, ChevronDown, ChevronRight, X, Check } from "lucide-react";

export default function ContactGroupsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rename, setRename] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["contact-groups", user?.email],
    queryFn: () => base44.entities.ContactGroup.list("-created_date", 100),
    enabled: !!user?.email,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contact-groups", user?.email] });

  const saveRename = async (g) => {
    if (!rename.trim()) { setEditing(null); return; }
    try {
      await base44.entities.ContactGroup.update(g.id, { name: rename.trim() });
      toast.success("Group renamed");
      invalidate();
    } catch { toast.error("Failed to rename"); }
    setEditing(null);
  };

  const removeGroup = async (g) => {
    if (!confirm(`Delete group "${g.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.ContactGroup.delete(g.id);
      toast.success("Group deleted");
      setExpanded(null);
      invalidate();
    } catch { toast.error("Failed to delete group"); }
  };

  const addContact = async (g, e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) { toast.error("Name and email required"); return; }
    const contacts = [...(g.contacts || []), { name: newName.trim(), email: newEmail.trim().toLowerCase() }];
    setBusy(true);
    try {
      await base44.entities.ContactGroup.update(g.id, { contacts });
      setNewName(""); setNewEmail("");
      invalidate();
    } catch { toast.error("Failed to add contact"); }
    setBusy(false);
  };

  const removeContact = async (g, idx) => {
    const contacts = (g.contacts || []).filter((_, i) => i !== idx);
    try {
      await base44.entities.ContactGroup.update(g.id, { contacts });
      invalidate();
    } catch { toast.error("Failed to remove contact"); }
  };

  return (
    <section className="mb-10">
      <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-primary" /> My Contact Groups
      </h2>
      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-body text-sm text-muted-foreground">You haven't saved any contact groups yet. When you book a table and invite companions, you can save a reusable guest list.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const open = expanded === g.id;
            const isEditing = editing === g.id;
            return (
              <div key={g.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => setExpanded(open ? null : g.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={rename}
                        onChange={(e) => setRename(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveRename(g)}
                        className="w-full border border-border rounded-lg px-2 py-1 text-sm bg-background font-body"
                      />
                    ) : (
                      <p className="font-body font-semibold text-foreground truncate">{g.name}</p>
                    )}
                    <p className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {g.contacts?.length || 0} contacts
                    </p>
                  </div>
                  {isEditing ? (
                    <button onClick={() => saveRename(g)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0"><Check className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={() => { setEditing(g.id); setRename(g.name); }} className="p-2 text-muted-foreground hover:text-foreground shrink-0"><Pencil className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => removeGroup(g)} className="p-2 text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>

                {open && (
                  <div className="border-t border-border p-4 bg-muted/30">
                    {(g.contacts?.length || 0) === 0 ? (
                      <p className="font-body text-xs text-muted-foreground text-center py-3">No contacts in this group yet.</p>
                    ) : (
                      <div className="space-y-1.5 mb-4">
                        {g.contacts.map((c, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm font-medium truncate">{c.name}</p>
                              <p className="font-body text-xs text-muted-foreground truncate">{c.email}</p>
                            </div>
                            <button onClick={() => removeContact(g, idx)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={(e) => addContact(g, e)} className="flex gap-2">
                      <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background font-body" />
                      <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email" type="email" className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background font-body" />
                      <button type="submit" disabled={busy} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1 shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}