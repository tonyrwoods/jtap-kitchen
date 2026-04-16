import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, File, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DocumentUploadModal({ invoice, onClose, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Contract");
  const [documents, setDocuments] = useState(invoice.documents || []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      const newDoc = {
        name: file.name,
        type: docType,
        url: uploadResponse.file_url,
        uploaded_date: new Date().toISOString().split("T")[0],
      };

      const updatedDocs = [...documents, newDoc];
      setDocuments(updatedDocs);
      
      await base44.entities.Invoice.update(invoice.id, { documents: updatedDocs });
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (index) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    await base44.entities.Invoice.update(invoice.id, { documents: updatedDocs });
    toast.success("Document removed");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Manage Documents</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-body text-sm text-muted-foreground">{invoice.vendor_name}</p>

        {/* Upload Section */}
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="font-body text-xs text-muted-foreground mb-2 block uppercase font-semibold">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            >
              <option value="Contract">Contract</option>
              <option value="W-9">W-9 Form</option>
              <option value="Receipt">Receipt</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">Click to upload</span>
              </>
            )}
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2 max-h-64 overflow-y-auto">
            {documents.map((doc, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <File className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-xs font-semibold text-primary hover:underline truncate block"
                    >
                      {doc.name}
                    </a>
                    <p className="font-body text-xs text-muted-foreground">
                      {doc.type} • {doc.uploaded_date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(idx)}
                  className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="font-body text-xs text-muted-foreground text-center py-4">
            No documents uploaded yet
          </p>
        )}

        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}