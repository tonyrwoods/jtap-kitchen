import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { parseContacts } from "@/lib/parseContacts";
import { Send, Loader2, Save, Users, X } from "lucide-react";
import { toast } from "sonner";

export default function BulkInviteInput({ onSend, busy, slotsFull }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = parseContacts(text);

  const handleSend = () => {
    if (!parsed.length) {
      toast.error("No valid contacts found");
      return;
    }
    onSend(parsed);
  };

  const saveGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }
    if (!parsed.length) {
      toast.error("No contacts to save");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.ContactGroup.create({
        name: groupName.trim(),
        owner_email: user.email,
        contacts: parsed,
      });
      toast.success(`Saved "${groupName.trim()}" with ${parsed.length} contact${parsed.length !== 1 ? "s" : ""}`);
      setGroupName("");
      setShowSave(false);
    } catch {
      toast.error("Failed to save group");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={slotsFull}
        rows={5}
        placeholder={"One contact per line, e.g.\nJane Smith, jane@email.com\njohn@email.com"}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body resize-none disabled:opacity-40"
      />
      {text.trim() && (
        <p className="font-body text-xs text-muted-foreground">
          {parsed.length} valid contact{parsed.length !== 1 ? "s" : ""} detected
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={busy || slotsFull || !parsed.length}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 justify-center"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Send className="w-3.5 h-3.5" /> Send {parsed.length || ""} Invite{parsed.length !== 1 ? "s" : ""}</>)}
        </button>
        <button
          type="button"
          onClick={() => setShowSave((s) => !s)}
          disabled={slotsFull || !parsed.length}
          className="px-4 py-2 border border-border rounded-lg font-body text-sm font-medium hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1.5 justify-center"
        >
          {showSave ? <X className="w-3.5 h-3.5" /> : <><Save className="w-3.5 h-3.5" /> Save as Group</>}
        </button>
      </div>
      {showSave && (
        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name (e.g. Family)"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
          />
          <button
            type="button"
            onClick={saveGroup}
            disabled={saving}
            className="px-4 py-2 bg-foreground text-background rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 justify-center"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}