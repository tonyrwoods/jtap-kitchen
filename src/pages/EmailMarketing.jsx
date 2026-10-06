import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import useRobotsNoindex from "@/hooks/useRobotsNoindex";
import { Plus, Send, Clock, Users, FileText, Trash2, ChevronRight, CheckCircle, FolderOpen, AlertCircle, Pencil, Paperclip, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const SEGMENTS = [
  { value: "All Subscribers", desc: "Everyone who joined your newsletter list" },
  { value: "Completed Guests", desc: "Guests who have dined with you" },
  { value: "Upcoming Reservations", desc: "Guests with confirmed future bookings" },
  { value: "VIP Guests (4+ people)", desc: "Groups of 4 or more guests" },
  { value: "Saved Contact Group", desc: "Send to a saved user contact group" },
];

const STATUS_COLORS = {
  Draft: "bg-muted text-muted-foreground",
  Scheduled: "bg-yellow-100 text-yellow-800",
  Sent: "bg-green-100 text-green-800",
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file

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
  useRobotsNoindex();
  const [campaigns, setCampaigns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | compose
  const [form, setForm] = useState({ title: "", subject: "", body: DEFAULT_TEMPLATE, segment: "All Subscribers", contact_group_id: "", scheduled_at: "", attachments: [] });
  const [sending, setSending] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const quillRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const resetForm = () => {
    setForm({ title: "", subject: "", body: DEFAULT_TEMPLATE, segment: "All Subscribers", contact_group_id: "", scheduled_at: "", attachments: [] });
    setEditingId(null);
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      title: c.title || "",
      subject: c.subject || "",
      body: c.body || DEFAULT_TEMPLATE,
      segment: c.segment || "All Subscribers",
      contact_group_id: c.contact_group_id || "",
      scheduled_at: c.scheduled_at ? c.scheduled_at.slice(0, 16) : "",
      attachments: c.attachments || [],
    });
    setView("compose");
  };

  const load = async () => {
    const data = await base44.entities.NewsletterCampaign.list("-created_date", 50);
    setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.entities.ContactGroup.list("-created_date", 100).then(setGroups).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // --- Image upload handler for the rich-text editor ---
  // Uploads the chosen image to public storage and embeds it at the cursor.
  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error("Image too large (max 10MB)");
        return;
      }
      setUploadingImage(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", file_url);
          editor.setSelection(range.index + 1, 0);
        } else {
          // Fallback: append to body HTML
          setForm(f => ({ ...f, body: `${f.body}<p><img src="${file_url}" style="max-width:100%;border-radius:8px;" /></p>` }));
        }
        toast.success("Image added to email");
      } catch {
        toast.error("Image upload failed");
      }
      setUploadingImage(false);
    };
    input.click();
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }, { size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        [{ indent: "-1" }, { indent: "+1" }],
        ["clean"],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  }), [handleImageUpload]);

  // --- File attachment upload ---
  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File too large (max 10MB)");
      return;
    }
    setUploadingAttachment(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm(f => ({
        ...f,
        attachments: [...(f.attachments || []), { filename: file.name, file_url, content_type: file.type || "application/octet-stream" }],
      }));
      toast.success("File attached");
    } catch {
      toast.error("File upload failed");
    }
    setUploadingAttachment(false);
  };

  const removeAttachment = (idx) => {
    setForm(f => ({ ...f, attachments: (f.attachments || []).filter((_, i) => i !== idx) }));
  };

  const saveDraft = async () => {
    setSaving(true);
    if (editingId) {
      await base44.entities.NewsletterCampaign.update(editingId, { ...form, status: "Draft" });
      toast.success("Draft updated!");
    } else {
      await base44.entities.NewsletterCampaign.create({ ...form, status: "Draft" });
      toast.success("Draft saved!");
    }
    setSaving(false);
    setView("list");
    resetForm();
    load();
  };

  const scheduleOrSend = async (sendNow) => {
    setSaving(true);
    let recordId;
    if (editingId) {
      await base44.entities.NewsletterCampaign.update(editingId, {
        ...form,
        status: sendNow ? "Draft" : "Scheduled",
      });
      recordId = editingId;
    } else {
      const created = await base44.entities.NewsletterCampaign.create({
        ...form,
        status: sendNow ? "Draft" : "Scheduled",
      });
      recordId = created.id;
    }
    if (sendNow) {
      await sendCampaign(recordId);
    } else {
      toast.success("Campaign scheduled!");
    }
    setSaving(false);
    setView("list");
    resetForm();
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

  const previewRecipients = async () => {
    setPreviewing(true);
    try {
      const res = await base44.functions.invoke("previewCampaignRecipients", { segment: form.segment, contact_group_id: form.contact_group_id });
      if (res.data?.success) setPreview(res.data);
      else toast.error(res.data?.error || "Failed to preview");
    } catch { toast.error("Failed to preview recipients"); }
    setPreviewing(false);
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
              <button onClick={() => { resetForm(); setView("compose"); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90">
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
                <button onClick={() => { resetForm(); setView("compose"); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
                  Create Campaign
                </button>
              </div>
            ) : campaigns.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-body font-semibold truncate">{c.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    {c.attachments?.length > 0 && (
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground shrink-0" title={`${c.attachments.length} attachment(s)`}>
                        <Paperclip className="w-3 h-3" />{c.attachments.length}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-muted-foreground truncate">{c.subject}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 font-body text-xs text-muted-foreground"><Users className="w-3 h-3" />{c.segment}</span>
                    {c.status === "Sent" && c.recipient_count != null && (
                      <span className="flex items-center gap-1 font-body text-xs text-green-700"><CheckCircle className="w-3 h-3" />Sent to {c.recipient_count}</span>
                    )}
                    {c.status === "Sent" && c.failed_count > 0 && (
                      <span className="flex items-center gap-1 font-body text-xs text-amber-700"><AlertCircle className="w-3 h-3" />{c.failed_count} failed</span>
                    )}
                    {c.scheduled_at && c.status === "Scheduled" && (
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(c.scheduled_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== "Sent" && (
                    <button
                      onClick={() => startEdit(c)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
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

              {/* Contact Group Picker */}
              {form.segment === "Saved Contact Group" && (
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" /> Select Contact Group *
                  </label>
                  {groups.length === 0 ? (
                    <p className="font-body text-xs text-muted-foreground">No saved contact groups yet. Users can create groups from their reservation invite page.</p>
                  ) : (
                    <select
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                      value={form.contact_group_id}
                      onChange={e => set("contact_group_id", e.target.value)}
                    >
                      <option value="">Choose a group…</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.contacts?.length || 0} contacts)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Recipient Preview */}
              <div>
                <button
                  type="button"
                  onClick={previewRecipients}
                  disabled={previewing || (form.segment === "Saved Contact Group" && !form.contact_group_id)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> {previewing ? "Counting…" : "Preview recipients"}
                </button>
                {preview && (
                  <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="font-body text-sm font-semibold text-foreground">~{preview.count} recipient{preview.count !== 1 ? "s" : ""}</p>
                    {preview.sample?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-body text-xs text-muted-foreground mb-1">Sample:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {preview.sample.map((r, i) => (
                            <span key={i} className="font-body text-xs bg-card border border-border px-2 py-0.5 rounded-full">{r.email}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-heading text-lg font-semibold">Email Body</h2>
                <span className="font-body text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> for personalization · Use the image button to embed images</span>
              </div>
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-primary font-body">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading image…
                </div>
              )}
              <div className="quill-wrapper border border-border rounded-xl overflow-hidden bg-background">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  modules={modules}
                  value={form.body}
                  onChange={(val) => set("body", val)}
                  placeholder="Write your email content here…"
                />
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-heading text-lg font-semibold">Attachments</h2>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">Files are attached to every sent email (max 10MB each)</p>
                </div>
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={uploadingAttachment}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {uploadingAttachment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                  {uploadingAttachment ? "Uploading…" : "Add File"}
                </button>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                />
              </div>
              {form.attachments?.length > 0 && (
                <div className="space-y-2">
                  {form.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate">{att.filename}</p>
                        <p className="font-body text-xs text-muted-foreground truncate">{att.content_type || "file"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                        aria-label="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveDraft}
                disabled={saving || !form.title || !form.subject || (form.segment === "Saved Contact Group" && !form.contact_group_id)}
                className="px-6 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Update Draft" : "Save as Draft"}
              </button>
              {form.scheduled_at && (
                <button
                  onClick={() => scheduleOrSend(false)}
                  disabled={saving || !form.title || !form.subject || (form.segment === "Saved Contact Group" && !form.contact_group_id)}
                  className="flex items-center gap-2 px-6 py-2.5 border border-primary text-primary rounded-full font-body text-sm font-medium hover:bg-primary/5 disabled:opacity-50 transition-colors"
                >
                  <Clock className="w-4 h-4" /> Schedule
                </button>
              )}
              <button
                onClick={() => scheduleOrSend(true)}
                disabled={saving || !form.title || !form.subject || (form.segment === "Saved Contact Group" && !form.contact_group_id)}
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