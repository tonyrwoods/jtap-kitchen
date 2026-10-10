import { useState, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail, Paperclip, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file

export default function ReservationEmailModal({ reservation, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const quillRef = useRef(null);
  const attachmentInputRef = useRef(null);

  // --- Image upload handler for the rich-text editor ---
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
          setBody(b => `${b}<p><img src="${file_url}" style="max-width:100%;border-radius:8px;" /></p>`);
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
      setAttachments(prev => [...prev, { filename: file.name, file_url, content_type: file.type || "application/octet-stream" }]);
      toast.success("File attached");
    } catch {
      toast.error("File upload failed");
    }
    setUploadingAttachment(false);
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke("sendReservationMessage", {
        reservation_id: reservation.id,
        subject: subject.trim(),
        message: body,
        attachments,
      });
      toast.success("Email sent to guest");
      onClose();
    } catch (err) {
      toast.error("Email failed: " + (err.message || "unknown error"));
    }
    setSending(false);
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Email Guest
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="font-body text-xs text-muted-foreground">
            To: <span className="font-medium text-foreground">{reservation.guest_name}</span> · {reservation.email}
          </p>
          <div>
            <label className="font-body text-sm font-semibold mb-1 block">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="Subject" />
          </div>
          <div>
            <label className="font-body text-sm font-semibold mb-1.5 block">Message</label>
            {uploadingImage && (
              <div className="flex items-center gap-2 text-sm text-primary font-body mb-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading image…
              </div>
            )}
            <div className="quill-wrapper border border-border rounded-xl overflow-hidden bg-background">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                modules={modules}
                value={body}
                onChange={setBody}
                placeholder="Write your message to the guest…"
              />
            </div>
            <p className="font-body text-xs text-muted-foreground mt-1.5">Use the image button to embed images in the email body.</p>
          </div>

          {/* File Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-body text-sm font-semibold">Attachments</label>
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={uploadingAttachment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full font-body text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {uploadingAttachment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
                {uploadingAttachment ? "Uploading…" : "Add File"}
              </button>
              <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate">{att.filename}</p>
                      <p className="font-body text-xs text-muted-foreground truncate">{att.content_type || "file"}</p>
                    </div>
                    <button type="button" onClick={() => removeAttachment(idx)} className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0" aria-label="Remove attachment">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSend} disabled={sending} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium disabled:opacity-50">
              {sending ? "Sending..." : "Send Email"}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-border rounded-full font-body text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}