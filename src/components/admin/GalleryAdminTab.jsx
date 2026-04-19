import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function GalleryAdminTab() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Food",
    image_url: "",
    sort_order: 0,
    is_active: true,
  });

  const CATEGORIES = ["Food", "Venue", "Events", "Team", "Moments"];

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const data = await base44.entities.GalleryImage.list("sort_order", 100);
    setImages(data);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.image_url) {
      toast.error("Title and image are required");
      return;
    }

    if (editingImage?.id) {
      await base44.entities.GalleryImage.update(editingImage.id, form);
      toast.success("Image updated");
    } else {
      await base44.entities.GalleryImage.create(form);
      toast.success("Image added");
    }

    await loadImages();
    setShowForm(false);
    setEditingImage(null);
    setForm({ title: "", description: "", category: "Food", image_url: "", sort_order: 0, is_active: true });
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setForm(image);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this image?")) {
      await base44.entities.GalleryImage.delete(id);
      await loadImages();
      toast.success("Image deleted");
    }
  };

  const handleSortChange = async (id, newOrder) => {
    await base44.entities.GalleryImage.update(id, { sort_order: newOrder });
    await loadImages();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Images", value: images.length, color: "bg-primary" },
          { label: "Active", value: images.filter(i => i.is_active).length, color: "bg-green-500" },
          { label: "Inactive", value: images.filter(i => !i.is_active).length, color: "bg-muted" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">{s.label}</p>
              <p className="font-heading text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-heading text-lg font-semibold">{editingImage?.id ? "Edit" : "Add"} Image</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="e.g., Pan-Seared Duck Breast"
              />
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                rows={2}
                placeholder="Brief description of the image"
              />
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="active" className="font-body text-sm">Show on Homepage</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingImage(null); setForm({ title: "", description: "", category: "Food", image_url: "", sort_order: 0, is_active: true }); }}
              className="px-5 py-2 border border-border rounded-full font-body text-sm"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingImage(null); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Image
        </button>
      )}

      {/* Gallery List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No gallery images yet. Add your first image to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {images.map(image => (
            <motion.div
              key={image.id}
              layout
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-40 bg-muted overflow-hidden">
                <img src={image.image_url} alt={image.title} className="w-full h-full object-cover" />
                {!image.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="font-body text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded">Hidden</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-body font-semibold text-sm mb-1">{image.title}</p>
                <p className="font-body text-xs text-muted-foreground mb-2">{image.category}</p>
                {image.description && (
                  <p className="font-body text-xs text-muted-foreground mb-3 line-clamp-2">{image.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(image)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-body text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-destructive rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-body text-xs"
                  >
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