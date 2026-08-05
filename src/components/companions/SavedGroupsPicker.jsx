import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { parseContacts } from "@/lib/parseContacts";
import { FolderOpen, Plus, Trash2, Loader2, Users, X, Send } from "lucide-react";
import { toast } from "sonner";

export default function SavedGroupsPicker({ onInvite, busy, slotsFull }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContacts, setNewContacts] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["contact-groups", user?.email],
    queryFn: () => base44.entities.ContactGroup.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["contact-groups", user?.email] });

  const createGroup = async () => {
    if (!newName.trim()) {
      toast.error("Group name required");
      return;
    }
    const contacts = parseContacts(newContacts);
    if (!contacts.length) {
      toast.error("Add at least one contact");
      return;
    }
    try {
      await base44.entities.ContactGroup.create({
        name: newName.trim(),
        owner_email: user.email,
        contacts,
      });
      toast.success("Group created");
      setNewName("");
      setNewContacts("");
      setCreating(false);
      refresh();
    } catch {
      toast.error("Failed to create group");
    }
  };

  const deleteGroup = async (g) => {
    try {
      await base44.entities.ContactGroup.delete(g.id);
      refresh();
      toast.success("Group deleted");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  if (!user?.email) {
    return (
      <p className="font-body text-xs text-muted-foreground text-center py-3">
        Sign in to save and reuse contact groups.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 && !creating ? (
        <div className="text-center py-4">
          <p className="font-body text-xs text-muted-foreground mb-3">No saved groups yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-foreground truncate">{g.name}</p>
                <p className="font-body text-xs text-muted-foreground">{g.contacts?.length || 0} contact{(g.contacts?.length || 0) !== 1 ? "s" : ""}</p>
              </div>
              <button
                type="button"
                onClick={() => onInvite(g.contacts || [])}
                disabled={busy || slotsFull}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-body font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Invite
              </button>
              <button
                type="button"
                onClick={() => deleteGroup(g)}
                aria-label={`Delete ${g.name}`}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {creating ? (
        <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name (e.g. Coworkers)"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
          />
          <textarea
            value={newContacts}
            onChange={(e) => setNewContacts(e.target.value)}
            rows={3}
            placeholder={"One contact per line\nName, email"}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createGroup}
              className="flex-1 px-3 py-2 bg-foreground text-background rounded-lg text-sm font-body font-semibold hover:opacity-90 inline-flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Create Group
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setNewName(""); setNewContacts(""); }}
              className="px-3 py-2 border border-border rounded-lg text-sm font-body font-medium hover:bg-muted inline-flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={slotsFull}
          className="w-full px-3 py-2 border border-dashed border-border rounded-lg text-sm font-body font-medium text-foreground hover:bg-muted disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create New Group
        </button>
      )}
    </div>
  );
}