import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

function TeamMemberForm({ member, onSave, onCancel }) {
  const [form, setForm] = useState(member || { name: "", role: "", bio: "", photo_url: "", sort_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (member?.id) {
      await base44.entities.TeamMember.update(member.id, form);
    } else {
      await base44.entities.TeamMember.create(form);
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{member?.id ? "Edit" : "Add"} Team Member</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Name *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Role *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.role} onChange={e => set("role", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Sort Order</label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.sort_order} onChange={e => set("sort_order", parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="rounded" />
            <span className="font-body text-sm">Show on Website</span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-2 block">Biography</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" rows={3} value={form.bio} onChange={e => set("bio", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-2 block">Photo</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-sm text-muted-foreground">{uploading ? "Uploading..." : "Choose photo"}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
            </label>
            {form.photo_url && (
              <img src={form.photo_url} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function TeamMembersTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    base44.entities.TeamMember.list("sort_order", 100).then(data => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  const refreshMembers = async () => {
    const data = await base44.entities.TeamMember.list("sort_order", 100);
    setMembers(data);
    setShowForm(false);
    setEditingMember(null);
  };

  const deleteMember = async (id) => {
    if (confirm("Delete this team member?")) {
      await base44.entities.TeamMember.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {!showForm && (
        <button onClick={() => { setEditingMember(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      )}
      {showForm && (
        <TeamMemberForm member={editingMember} onSave={refreshMembers} onCancel={() => { setShowForm(false); setEditingMember(null); }} />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map(member => (
          <div key={member.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {member.photo_url && (
              <img src={member.photo_url} alt={member.name} className="w-full aspect-square object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-heading text-lg font-semibold text-foreground">{member.name}</h3>
              <p className="font-body text-sm text-primary font-medium mb-2">{member.role}</p>
              {member.bio && <p className="font-body text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{member.bio}</p>}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button onClick={() => { setEditingMember(member); setShowForm(true); }} className="p-2 hover:text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMember(member.id)} className="p-2 hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="ml-auto">
                  {!member.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Hidden</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {members.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="font-body text-muted-foreground">No team members yet.</p>
        </div>
      )}
    </motion.div>
  );
}