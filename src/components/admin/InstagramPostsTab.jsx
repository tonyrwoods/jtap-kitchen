import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, Instagram } from "lucide-react";
import { toast } from "sonner";

export default function InstagramPostsTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ image_url: "", caption: "", sort_order: 0, is_active: true });

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await base44.entities.InstagramPost.list("sort_order", 50);
    setPosts(data);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, image_url: file_url }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image_url) { toast.error("An image is required"); return; }
    if (editing?.id) {
      await base44.entities.InstagramPost.update(editing.id, form);
      toast.success("Post updated");
    } else {
      await base44.entities.InstagramPost.create(form);
      toast.success("Post added");
    }
    await loadPosts();
    setShowForm(false);
    setEditing(null);
    setForm({ image_url: "", caption: "", sort_order: 0, is_active: true });
  };

  const handleEdit = (post) => {
    setEditing(post);
    setForm(post);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this post?")) {
      await base44.entities.InstagramPost.delete(id);
      await loadPosts();
      toast.success("Post deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Posts", value: posts.length, color: "bg-primary" },
          { label: "Active", value: posts.filter(p => p.is_active).length, color: "bg-green-500" },
          { label: "Inactive", value: posts.filter(p => !p.is_active).length, color: "bg-muted" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">{s.label}</p>
              <p className="font-heading text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-heading text-lg font-semibold">{editing?.id ? "Edit" : "Add"} Follow Along Post</h3>

          <div>
            <label className="font-body text-sm text-muted-foreground mb-2 block">Image *</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload"}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
              )}
            </div>
          </div>

          <div>
            <label className="font-body text-sm text-muted-foreground mb-1 block">Caption</label>
            <textarea
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              rows={2}
              placeholder="Caption shown under the post"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ig-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
              <label htmlFor="ig-active" className="font-body text-sm">Show on Homepage</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ image_url: "", caption: "", sort_order: 0, is_active: true }); }} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </motion.form>
      )}

      {!showForm && (
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Post
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <Instagram className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No posts yet. Add your first photo to populate the Follow Along section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map(post => (
            <motion.div key={post.id} layout className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-muted overflow-hidden">
                <img src={post.image_url} alt={post.caption || "post"} className="w-full h-full object-cover" />
                {!post.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="font-body text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded">Hidden</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                {post.caption && <p className="font-body text-xs text-muted-foreground mb-3 line-clamp-2">{post.caption}</p>}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(post)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-body text-xs">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-destructive rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-body text-xs">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}