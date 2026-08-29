import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPES = [
  "Birthday Party", "Corporate Event", "Wedding Reception", "Baby/Bridal Shower",
  "Graduation Party", "Holiday Party", "Wine Tasting", "Tasting Menu",
  "Chef's Table", "Cooking Class", "Special Occasion", "Other"
];

const EMPTY = {
  title: "", subtitle: "", description: "", event_type: "Birthday Party",
  date: "", time: "", end_time: "", location_label: "JTAP Kitchen — Memphis, TN",
  rsvp_deadline: "", max_guests: 50, price_per_guest: 0, default_discount_amount: 0, host_name: "",
  host_message: "", invite_email_subject: "", banner_image_url: "", is_active: true
};

function generateSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PromotionForm({ promotion, onSave, onCancel }) {
  const [form, setForm] = useState(promotion || { ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendToLoyalty, setSendToLoyalty] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("banner_image_url", file_url);
    } catch {
      toast.error("Image upload failed");
    }
    setUploading(false);
  };

  const sendToLoyaltyMembers = async (promo) => {
    try {
      const members = await base44.entities.TapRoomMember.list("-created_date", 500);
      const existing = await base44.entities.EventInvite.filter({ promotion_id: promo.id });
      const existingEmails = new Set(existing.map((i) => (i.guest_email || "").toLowerCase()));
      const discount = parseFloat(form.default_discount_amount) || 0;
      const records = members
        .filter((m) => m.email && m.status !== "Inactive" && !existingEmails.has(m.email.toLowerCase()))
        .map((m) => ({
          promotion_id: promo.id,
          promotion_title: promo.title,
          guest_name: m.guest_name,
          guest_email: m.email.toLowerCase(),
          invite_token: crypto.randomUUID(),
          rsvp_status: "Pending",
          party_size: 1,
          discount_amount: discount,
        }));
      if (records.length === 0) {
        toast.info("All loyalty members are already invited");
        return;
      }
      await base44.entities.EventInvite.bulkCreate(records);
      const res = await base44.functions.invoke("sendEventInvite", { promotion_id: promo.id, send_to_all: true });
      const sent = res.data?.sent || 0;
      toast.success(`Invited ${records.length} loyalty member${records.length !== 1 ? "s" : ""}${sent ? ` · ${sent} email${sent !== 1 ? "s" : ""} sent` : ""}${discount > 0 ? ` · $${discount.toFixed(2)} off each` : ""}`);
    } catch {
      toast.error("Loyalty invites failed — send them from Invite Management");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.host_name) {
      toast.error("Title, date, and host name are required");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, max_guests: parseInt(form.max_guests) || 0, price_per_guest: parseFloat(form.price_per_guest) || 0, default_discount_amount: parseFloat(form.default_discount_amount) || 0 };
      if (!promotion?.id) {
        data.share_slug = generateSlug(form.title);
      }
      let promoId;
      let promoTitle;
      if (promotion?.id) {
        await base44.entities.EventPromotion.update(promotion.id, data);
        toast.success("Promotion updated");
        promoId = promotion.id;
        promoTitle = data.title;
      } else {
        const saved = await base44.entities.EventPromotion.create(data);
        toast.success("Promotion created");
        promoId = saved.id;
        promoTitle = saved.title;
      }
      if (sendToLoyalty && promoId) {
        await sendToLoyaltyMembers({ id: promoId, title: promoTitle });
      }
      onSave();
    } catch (err) {
      toast.error("Failed to save promotion");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-background rounded-2xl border border-border w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
          <h3 className="font-heading text-lg font-semibold">{promotion?.id ? "Edit" : "New"} Promotion</h3>
          <button onClick={onCancel} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Event / Party Title *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Sarah's 30th Birthday" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Subtitle / Tagline</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="A night to remember" />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Event Type *</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.event_type} onChange={(e) => set("event_type", e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Host Name *</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.host_name} onChange={(e) => set("host_name", e.target.value)} required placeholder="Sarah Johnson" />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Event Date *</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Start Time</label>
              <input type="time" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">End Time</label>
              <input type="time" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">RSVP Deadline</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.rsvp_deadline} onChange={(e) => set("rsvp_deadline", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Max Guests</label>
              <input type="number" min="1" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.max_guests} onChange={(e) => set("max_guests", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Price per Guest ($)</label>
              <input type="number" step="0.01" min="0" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.price_per_guest} onChange={(e) => set("price_per_guest", e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1 block">Default Discount per Guest ($)</label>
              <input type="number" step="0.01" min="0" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.default_discount_amount} onChange={(e) => set("default_discount_amount", e.target.value)} placeholder="0.00" />
              <p className="font-body text-xs text-muted-foreground mt-1">Applied to every loyalty member invite created from this template.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Location Label</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.location_label} onChange={(e) => set("location_label", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Announcement Description</label>
              <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the event — what to expect, dress code, special notes..." />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Personal Host Message (shown on announcement & invites)</label>
              <textarea rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none" value={form.host_message} onChange={(e) => set("host_message", e.target.value)} placeholder="I'd love for you to join me in celebrating..." />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-1 block">Invite Email Subject (optional)</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.invite_email_subject} onChange={(e) => set("invite_email_subject", e.target.value)} placeholder={`You're Invited — ${form.title || "Event"}`} />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-muted-foreground mb-2 block">Advertisement Banner Image</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="font-body text-sm text-muted-foreground">{uploading ? "Uploading..." : form.banner_image_url ? "Change image" : "Upload banner"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {form.banner_image_url && <img src={form.banner_image_url} alt="Banner preview" className="w-16 h-16 rounded-lg object-cover" />}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4" />
                <span className="font-body text-sm">Active (visible on website & eligible for invites)</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sendToLoyalty} onChange={(e) => setSendToLoyalty(e.target.checked)} className="w-4 h-4" />
                <span className="font-body text-sm">Send invites to all loyalty members now</span>
              </label>
              {sendToLoyalty && <p className="font-body text-xs text-muted-foreground mt-1 ml-6">Creates a pending invite (with the discount above) for every active Tap Room member and emails them immediately. Members already invited are skipped.</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving..." : promotion?.id ? "Update Promotion" : "Create Promotion"}
            </button>
            <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-border rounded-lg font-body text-sm font-medium hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}