import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";

const PLACEHOLDERS = "{title} {subtitle} {date} {time} {endtime} {location} {price} {discount} {description} {rsvp_deadline} {link}";

export default function SocialMediaSettingsModal({ onClose }) {
  const [platforms, setPlatforms] = useState(["instagram", "facebook"]);
  const [template, setTemplate] = useState("");
  const [hashtags, setHashtags] = useState("jtapkitchen, memphis, foodie");
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.AppSettings.list()
      .then((rows) => {
        const s = rows[0] || {};
        setPlatforms(s.social_default_platforms && s.social_default_platforms.length ? s.social_default_platforms : ["instagram", "facebook"]);
        setTemplate(s.social_caption_template || "");
        setHashtags(s.social_hashtags || "jtapkitchen, memphis, foodie");
        setSettingsId(s.id || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (p) => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const save = async () => {
    setSaving(true);
    try {
      const data = { social_default_platforms: platforms, social_caption_template: template, social_hashtags: hashtags };
      if (settingsId) await base44.entities.AppSettings.update(settingsId, data);
      else await base44.entities.AppSettings.create(data);
      toast.success("Social media settings saved");
      onClose();
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-background rounded-2xl border border-border w-full max-w-xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
          <div>
            <h3 className="font-heading text-lg font-semibold">Social Media Settings</h3>
            <p className="font-body text-xs text-muted-foreground">New promotions auto-post using these defaults.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Auto-post platforms</label>
              <p className="font-body text-xs text-muted-foreground mb-3">Each new active promotion is posted to these automatically.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => toggle("instagram")} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-body text-sm font-medium transition-all ${platforms.includes("instagram") ? "border-pink-500 bg-pink-50 text-pink-700" : "border-border text-muted-foreground"}`}>
                  <Instagram className="w-4 h-4" /> Instagram
                </button>
                <button type="button" onClick={() => toggle("facebook")} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-body text-sm font-medium transition-all ${platforms.includes("facebook") ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border text-muted-foreground"}`}>
                  <Facebook className="w-4 h-4" /> Facebook
                </button>
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-semibold mb-1.5 block">Caption template</label>
              <p className="font-body text-xs text-muted-foreground mb-2">Leave blank to use the default format. Available placeholders:</p>
              <code className="block font-mono text-xs bg-muted rounded-lg p-2 mb-2 text-muted-foreground break-all">{PLACEHOLDERS}</code>
              <textarea rows={5} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono resize-none" value={template} onChange={(e) => setTemplate(e.target.value)} placeholder={"🎉 {title}\n{subtitle}\n📅 {date} at {time}\n📍 {location}\n{description}\n\nReserve: {link}"} />
            </div>
            <div>
              <label className="font-body text-sm font-semibold mb-1.5 block">Hashtags</label>
              <p className="font-body text-xs text-muted-foreground mb-2">Comma-separated — appended to every post.</p>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="jtapkitchen, memphis, foodie" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving || platforms.length === 0} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
              </button>
              <button onClick={onClose} className="px-6 py-2.5 border border-border rounded-lg font-body text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}