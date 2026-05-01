import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, CheckCircle } from "lucide-react";

export default function InviteUserPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await base44.users.inviteUser(email.trim(), role);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err.message || "Failed to send invite. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold">Invite a User</h3>
          <p className="font-body text-xs text-muted-foreground">Send an invitation to give someone access to the app.</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setSuccess(false); setError(""); }}
            placeholder="colleague@jtapkitchen.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground block mb-2">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          >
            <option value="user">Staff (User)</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <p className="font-body text-sm">Invitation sent successfully!</p>
          </div>
        )}
        {error && (
          <p className="font-body text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}