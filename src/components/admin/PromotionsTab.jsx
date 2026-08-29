import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Megaphone, Pencil, Trash2, ArrowLeft, CalendarDays, Users, Copy, ExternalLink, Share2 } from "lucide-react";
import PromotionForm from "../events/PromotionForm";
import SocialMediaSettingsModal from "./SocialMediaSettingsModal";
import InviteeManager from "../events/InviteeManager";
import RsvpDashboard from "../events/RsvpDashboard";

export default function PromotionsTab() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const [postingSocial, setPostingSocial] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.EventPromotion.list("-created_date", 100)
      .then(setPromotions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (promo) => {
    if (!confirm(`Delete "${promo.title}"? This also removes all associated invites.`)) return;
    await base44.entities.EventInvite.deleteMany({ promotion_id: promo.id });
    await base44.entities.EventPromotion.delete(promo.id);
    toast.success("Promotion deleted");
    load();
  };

  const PROD_ORIGIN = "https://jtapkitchen.com";
  const copyLink = (slug) => {
    const url = `${PROD_ORIGIN}/event-announce/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Announcement link copied");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const postToSocial = async () => {
    if (!selected) return;
    setPostingSocial(true);
    try {
      const res = await base44.functions.invoke("postPromotionToSocial", { promotion_id: selected.id });
      const r = res.data?.results || {};
      const parts = Object.entries(r).map(
        ([platform, info]) => `${platform}: ${info.success ? "✓ posted" : "✗ " + (info.error || "failed")}`
      );
      if (parts.length) toast.info(parts.join("  ·  "));
      else toast.info("No social platforms are configured");
    } catch (e) {
      toast.error("Social post failed: " + (e.message || "unknown error"));
    }
    setPostingSocial(false);
  };

  if (selected) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to promotions
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => copyLink(selected.share_slug)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg font-body text-xs font-medium hover:bg-muted">
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
            <button onClick={postToSocial} disabled={postingSocial} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-body text-xs font-medium hover:opacity-90 disabled:opacity-50">
              <Share2 className="w-3.5 h-3.5" /> {postingSocial ? "Posting…" : "Post to Social"}
            </button>
            <button onClick={() => { setEditing(selected); setShowForm(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg font-body text-xs font-medium hover:bg-muted">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => handleDelete(selected)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-destructive rounded-lg font-body text-xs font-medium hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {selected.banner_image_url && <img src={selected.banner_image_url} alt={selected.title} className="w-full h-40 object-cover" />}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl font-bold">{selected.title}</h3>
                {selected.subtitle && <p className="font-body text-sm text-primary italic mt-0.5">{selected.subtitle}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${selected.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {selected.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(selected.date)}{selected.time ? ` · ${selected.time}` : ""}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Max {selected.max_guests || "∞"} guests</span>
              <span className="inline-flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> {selected.event_type}</span>
            </div>
            {selected.description && <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">{selected.description}</p>}
          </div>
        </div>

        <div>
          <h4 className="font-heading text-base font-semibold mb-3">RSVP Tracking</h4>
          <RsvpDashboard promotion={selected} />
        </div>

        <div>
          <h4 className="font-heading text-base font-semibold mb-3">Invite Management</h4>
          <InviteeManager promotion={selected} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Event Promotions</h3>
          <p className="font-body text-sm text-muted-foreground">Create event announcements, send invites, and track RSVPs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSocialSettings(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-body text-sm font-medium hover:bg-muted">
            <Share2 className="w-4 h-4" /> Social Settings
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" /> New Promotion
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No promotions yet.</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold">
            <Plus className="w-4 h-4" /> Create your first promotion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(promo)}>
              {promo.banner_image_url ? (
                <img src={promo.banner_image_url} alt={promo.title} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Megaphone className="w-8 h-8 text-primary/40" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-heading text-base font-semibold leading-tight">{promo.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${promo.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {promo.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDate(promo.date)}</span>
                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {promo.event_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PromotionForm
          promotion={editing}
          onSave={() => { setShowForm(false); setEditing(null); load(); if (editing) setSelected(null); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {showSocialSettings && <SocialMediaSettingsModal onClose={() => setShowSocialSettings(false)} />}
    </div>
  );
}