import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Send, Clock, Users, FileText, Trash2, ChevronRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SEGMENTS = [
  { value: "All Subscribers", desc: "Everyone who joined your newsletter list" },
  { value: "Completed Guests", desc: "Guests who have dined with you" },
  { value: "Upcoming Reservations", desc: "Guests with confirmed future bookings" },
  { value: "VIP Guests (4+ people)", desc: "Groups of 4 or more guests" },
];

const STATUS_COLORS = {
  Draft: "bg-muted text-muted-foreground",
  Scheduled: "bg-yellow-100 text-yellow-800",
  Sent: "bg-green-100 text-green-800",
};

const DEFAULT_TEMPLATE = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1a1a1a;padding:32px;text-align:center;">
    <h1 style="color:#c89b4f;font-size:26px;margin:0;letter-spacing:2px;">JTAP Kitchen</h1>
  </div>
  <div style="padding:40px 32px;background:#faf9f7;">
    <h2 style="font-size:22px;">Hello {{name}},</h2>
    <p style="color:#666;line-height:1.7;">Write your message here...</p>
  </div>
  <div style="padding:24px 32px;background:#1a1a1a;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0;">© ${new Date().getFullYear()} JTAP Kitchen · Memphis, TN</p>
  </div>
</div>`;

export default function EmailMarketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | compose
  const [form, setForm] = useState({ title: "", subject: "", body: DEFAULT_TEMPLATE, segment: "All Subscribers", scheduled_at: "" });
  const [sending, setSending] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.NewsletterCampaign.list("-created_date", 50);
    setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveDraft = async () => {
    setSaving(true);
    await base44.entities.NewsletterCampaign.create({ ...form, status: "Draft" });
    toast.success("Draft saved!");
    setSaving(false);
    setView("list");
    setForm({ title: "", subject: "", body: DEFAULT_TEMPLATE, segment: "All Subscribers", scheduled_at: "" });
    load();
  };

  const scheduleOrSend = async (sendNow) => {
    setSaving(true);
    const record = await base44.entities.NewsletterCampaign.create({
      ...form,
      status: sendNow ? "Draft" : "Scheduled",
    });
    if (sendNow) {
      await sendCampaign(record.id);
    } else {
      toast.success("Campaign scheduled!");
    }
    setSaving(false);
    setView("list");
    setForm({ title: "", subject: "", body: DEFAULT_TEMPLATE, segment: "All Subscribers", scheduled_at: "" });
    load();
  };

  const sendCampaign = async (id) => {
    setSending(id);
    const res = await base44.functions.invoke("sendNewsletterCampaign", { campaignId: id });
    toast.success(`Sent to ${res.data.sent} recipients!`);
    setSending(null);
    load();
  };

  const deleteCampaign = async (id) => {
    await base44.entities.NewsletterCampaign.delete(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success("Campaign deleted.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 lg:px-10 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Email Marketing</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Create and send newsletters to your guests</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
            {view === "list" && (
              <button onClick={() => setView("compose")} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
        {view === "list" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-24 bg-card border border-border rounded-2xl">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-heading text-lg font-semibold mb-1">No campaigns yet</p>
                <p className="font-body text-sm text-muted-foreground mb-6">Create your first email campaign to get started.</p>
                <button onClick={() => setView("compose")} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
                  Create Campaign
                </button>
              </div>
            ) : campaigns.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-body font-semibold truncate">{c.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground truncate">{c.subject}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 font-body text-xs text-muted-foreground"><Users className="w-3 h-3" />{c.segment}</span>
                    {c.status === "Sent" && c.recipient_count != null && (
                      <span className="flex items-center gap-1 font-body text-xs text-green-700"><CheckCircle className="w-3 h-3" />Sent to {c.recipient_count}</span>
                    )}
                    {c.scheduled_at && c.status === "Scheduled" && (
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(c.scheduled_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== "Sent" && (
                    <button
                      onClick={() => sendCampaign(c.id)}
                      disabled={sending === c.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sending === c.id ? "Sending…" : "Send Now"}
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(c.id)} className="p-2 hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {view === "compose" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button onClick={() => setView("list")} className="font-body text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              ← Back to Campaigns
            </button>

            {/* Campaign Details */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="font-heading text-lg font-semibold">Campaign Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1.5 block">Campaign Title *</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                    placeholder="e.g. Spring Menu Launch"
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1.5 block">Email Subject *</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                    placeholder="e.g. Discover Our New Spring Menu"
                    value={form.subject}
                    onChange={e => set("subject", e.target.value)}
                  />
                </div>
              </div>

              {/* Segment Picker */}
              <div>
                <label className="font-body text-sm text-muted-foreground mb-2 block">Audience Segment *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEGMENTS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set("segment", s.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${form.segment === s.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
                    >
                      <p className="font-body text-sm font-semibold">{s.value}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">Schedule (optional — leave blank to send manually)</label>
                <input
                  type="datetime-local"
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                  value={form.scheduled_at}
                  onChange={e => set("scheduled_at", e.target.value)}
                />
              </div>
            </div>

            {/* Email Body */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">Email Body</h2>
                <span className="font-body text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> for personalization</span>
              </div>
              <textarea
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-body font-mono resize-none focus:outline-none focus:border-primary transition-colors"
                rows={14}
                value={form.body}
                onChange={e => set("body", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveDraft}
                disabled={saving || !form.title || !form.subject}
                className="px-6 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              {form.scheduled_at && (
                <button
                  onClick={() => scheduleOrSend(false)}
                  disabled={saving || !form.title || !form.subject}
                  className="flex items-center gap-2 px-6 py-2.5 border border-primary text-primary rounded-full font-body text-sm font-medium hover:bg-primary/5 disabled:opacity-50 transition-colors"
                >
                  <Clock className="w-4 h-4" /> Schedule
                </button>
              )}
              <button
                onClick={() => scheduleOrSend(true)}
                disabled={saving || !form.title || !form.subject}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" /> Send Now
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}