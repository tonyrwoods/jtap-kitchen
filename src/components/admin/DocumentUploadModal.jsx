import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, X, FileText, Sparkles, Tag, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { logInvoiceAction } from "@/lib/auditLogHelper";
import SelectDropdown from "../SelectDropdown";

const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Software Subscriptions",
  "Office Supplies",
  "Utilities",
  "Equipment & Maintenance",
  "Marketing & Advertising",
  "Professional Services",
  "Staffing & Labor",
  "Rent & Facilities",
  "Insurance",
  "Logistics & Shipping",
  "Other",
];

const DOC_TYPES = ["Contract", "W-9", "Receipt", "Other"];

const CONFIDENCE_STYLES = {
  high: { color: "text-green-700 bg-green-100", icon: CheckCircle, label: "High confidence" },
  medium: { color: "text-yellow-700 bg-yellow-100", icon: AlertCircle, label: "Medium confidence" },
  low: { color: "text-red-700 bg-red-100", icon: AlertCircle, label: "Low confidence — please review" },
};

export default function DocumentUploadModal({ invoice, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("Receipt");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(invoice.expense_category || "");
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUploadAndExtract = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setExtracting(true);

      const response = await base44.functions.invoke("extractInvoiceData", { file_url });
      const data = response.data?.extracted;

      if (data) {
        setExtracted({ ...data, file_url });
        if (data.expense_category) {
          setSelectedCategory(data.expense_category);
        }
      } else {
        toast.error("Could not extract data from this document.");
      }
    } catch (err) {
      toast.error(`Extraction failed: ${err.message}`);
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      // Upload file if not already uploaded during extraction
      let fileUrl = extracted?.file_url;
      if (!fileUrl) {
        const result = await base44.integrations.Core.UploadFile({ file });
        fileUrl = result.file_url;
      }

      const newDoc = {
        name: file.name,
        type: docType,
        url: fileUrl,
        uploaded_date: new Date().toISOString().split("T")[0],
      };

      const updatedDocs = [...(invoice.documents || []), newDoc];
      const updates = { documents: updatedDocs };

      // Apply category if selected/changed
      if (selectedCategory && selectedCategory !== invoice.expense_category) {
        updates.expense_category = selectedCategory;
      }

      // Apply extracted financial data if available
      if (extracted) {
        if (extracted.vendor_name && !invoice.vendor_name) updates.vendor_name = extracted.vendor_name;
        if (extracted.total && !invoice.total) updates.total = extracted.total;
        if (extracted.subtotal) updates.subtotal = extracted.subtotal;
        if (extracted.tax_rate) updates.tax_rate = extracted.tax_rate;
        if (extracted.tax_amount) updates.tax_amount = extracted.tax_amount;
        if (extracted.notes) updates.notes = extracted.notes;
        if (extracted.installment_plan && extracted.installment_plan !== "None") {
          updates.installment_plan = extracted.installment_plan;
          if (extracted.first_payment_due) updates.first_payment_due = extracted.first_payment_due;
        }
        if (extracted.receipt_number) updates.receipt_number = extracted.invoice_number;
      }

      await base44.entities.Invoice.update(invoice.id, updates);

      await logInvoiceAction(
        invoice.id,
        invoice.vendor_name || extracted?.vendor_name || "Unknown",
        "Document Attached",
        `Uploaded ${file.name} (${docType})${selectedCategory ? ` — Category: ${selectedCategory}` : ""}`
      );

      toast.success("Document saved successfully");
      onSave();
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const confidenceInfo = extracted?.category_confidence
    ? CONFIDENCE_STYLES[extracted.category_confidence] || CONFIDENCE_STYLES.medium
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-heading text-lg font-semibold">Documents & AI Categorization</h3>
            <p className="font-body text-xs text-muted-foreground mt-0.5">{invoice.vendor_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Existing documents */}
          {invoice.documents?.length > 0 && (
            <div>
              <p className="font-body text-xs text-muted-foreground uppercase font-semibold mb-2">Attached Documents</p>
              <div className="space-y-2">
                {invoice.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm truncate">{doc.name}</p>
                      <p className="font-body text-xs text-muted-foreground">{doc.type} · {doc.uploaded_date}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Current Category */}
          {invoice.expense_category && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
              <Tag className="w-4 h-4 text-primary shrink-0" />
              <p className="font-body text-sm">
                <span className="text-muted-foreground">Current category:</span>{" "}
                <span className="font-semibold text-primary">{invoice.expense_category}</span>
              </p>
            </div>
          )}

          {/* Upload new document */}
          <div>
            <p className="font-body text-xs text-muted-foreground uppercase font-semibold mb-2">Upload New Document</p>
            <div className="space-y-3">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">Document Type</label>
                <SelectDropdown
                  value={docType}
                  onChange={setDocType}
                  options={DOC_TYPES.map(t => ({ value: t, label: t }))}
                />
              </div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => document.getElementById("doc-file-input").click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                {file ? (
                  <p className="font-body text-sm font-semibold text-foreground">{file.name}</p>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">Click to select a file (PDF, image, etc.)</p>
                )}
                <input id="doc-file-input" type="file" className="hidden" onChange={handleFileChange} />
              </div>

              {file && !extracted && (
                <button
                  onClick={handleUploadAndExtract}
                  disabled={uploading || extracting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-lg font-body text-sm font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {uploading || extracting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? "Uploading..." : "Extracting data..."}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Analyze with AI & Auto-Categorize</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* AI Extracted Results */}
          {extracted && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="font-body text-sm font-semibold">AI Extraction Results</p>
              </div>

              {/* Extracted fields summary */}
              <div className="grid grid-cols-2 gap-2 text-xs font-body">
                {extracted.vendor_name && (
                  <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{extracted.vendor_name}</span></div>
                )}
                {extracted.total && (
                  <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">${Number(extracted.total).toFixed(2)}</span></div>
                )}
                {extracted.invoice_date && (
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{extracted.invoice_date}</span></div>
                )}
                {extracted.payment_terms && (
                  <div><span className="text-muted-foreground">Terms:</span> <span className="font-medium">{extracted.payment_terms}</span></div>
                )}
              </div>

              {/* Category suggestion */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <p className="font-body text-sm font-semibold">Suggested Category</p>
                  </div>
                  {confidenceInfo && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${confidenceInfo.color}`}>
                      <confidenceInfo.icon className="w-3 h-3" />
                      {confidenceInfo.label}
                    </span>
                  )}
                </div>

                {extracted.category_reasoning && (
                  <p className="font-body text-xs text-muted-foreground italic">{extracted.category_reasoning}</p>
                )}

                <SelectDropdown
                   value={selectedCategory}
                   onChange={setSelectedCategory}
                   options={[
                     { value: "", label: "— Select a category —" },
                     ...EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))
                   ]}
                 />
              </div>
            </div>
          )}

          {/* Manual category assignment (if no extraction done) */}
          {!extracted && (
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase font-semibold mb-2 block">
                Expense Category
              </label>
              <SelectDropdown
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: "", label: "— Select a category —" },
                  ...EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))
                ]}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!file || saving}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Document"}
          </button>
        </div>
      </div>
    </div>
  );
}