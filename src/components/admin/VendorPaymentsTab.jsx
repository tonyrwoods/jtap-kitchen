import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Check, AlertCircle, Calendar, Upload } from "lucide-react";
import { toast } from "sonner";

function PaymentStatusBadge({ status }) {
  const colors = {
    "Paid On Time": "bg-green-100 text-green-800",
    "Paid Late": "bg-yellow-100 text-yellow-800",
    Pending: "bg-gray-100 text-gray-800",
    Overdue: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}

function ReconciliationModal({ payment, onClose, onSave }) {
  const [form, setForm] = useState({
    is_reconciled: payment.is_reconciled || false,
    has_discrepancy: payment.has_discrepancy || false,
    discrepancy_amount: payment.discrepancy_amount || "",
    discrepancy_notes: payment.discrepancy_notes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updates = {
      is_reconciled: form.is_reconciled,
      has_discrepancy: form.has_discrepancy,
      discrepancy_amount: form.discrepancy_amount ? parseFloat(form.discrepancy_amount) : undefined,
      discrepancy_notes: form.discrepancy_notes,
    };

    if (form.is_reconciled && !payment.reconciled_date) {
      updates.reconciled_date = new Date().toISOString().split("T")[0];
    }

    await base44.entities.VendorPayment.update(payment.id, updates);
    toast.success("Payment reconciliation updated");
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4"
      >
        <div>
          <h3 className="font-heading text-lg font-semibold">Reconcile Payment</h3>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {payment.vendor_name} - Payment {payment.payment_number} (${Number(payment.amount).toFixed(2)})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="reconciled"
            checked={form.is_reconciled}
            onChange={(e) => setForm({ ...form, is_reconciled: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="reconciled" className="font-body text-sm font-medium">
            Mark as Reconciled
          </label>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="discrepancy"
              checked={form.has_discrepancy}
              onChange={(e) => setForm({ ...form, has_discrepancy: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="discrepancy" className="font-body text-sm font-medium">
              Flag Discrepancy
            </label>
          </div>

          {form.has_discrepancy && (
            <div className="space-y-3 ml-6">
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">
                  Discrepancy Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                  value={form.discrepancy_amount}
                  onChange={(e) => setForm({ ...form, discrepancy_amount: e.target.value })}
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground mb-1 block">
                  Notes
                </label>
                <textarea
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                  rows="3"
                  value={form.discrepancy_notes}
                  onChange={(e) => setForm({ ...form, discrepancy_notes: e.target.value })}
                  placeholder="Describe the discrepancy..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-full font-body text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function VendorInvoiceForm({ invoice, onSave, onCancel }) {
  const [form, setForm] = useState({
    vendor_name: invoice?.vendor_name || "",
    installment_plan: invoice?.installment_plan || "None",
    first_payment_due: invoice?.first_payment_due || "",
    payment_dates: ["", "", ""],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor_name || !form.installment_plan) {
      toast.error("Vendor name and plan type are required");
      return;
    }

    const updates = {
      is_vendor_invoice: true,
      vendor_name: form.vendor_name,
      installment_plan: form.installment_plan,
      first_payment_due: form.first_payment_due,
    };

    await base44.entities.Invoice.update(invoice.id, updates);

    // Create payment records
    const paymentAmount = invoice.total / 3;
    for (let i = 0; i < 3; i++) {
      let dueDate;
      if (form.installment_plan === "Specific Dates") {
        dueDate = form.payment_dates[i];
      } else {
        // 30 days apart
        const firstDate = new Date(form.first_payment_due);
        const paymentDate = new Date(firstDate);
        paymentDate.setDate(paymentDate.getDate() + i * 30);
        dueDate = paymentDate.toISOString().split("T")[0];
      }

      await base44.entities.VendorPayment.create({
        invoice_id: invoice.id,
        vendor_name: form.vendor_name,
        payment_number: i + 1,
        amount: parseFloat((paymentAmount).toFixed(2)),
        due_date: dueDate,
        status: "Pending",
      });
    }

    toast.success("Payment plan created");
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
      <h3 className="font-heading text-lg font-semibold">Set Up Payment Plan</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Vendor Name *</label>
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.vendor_name}
            onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Payment Schedule *</label>
          <select
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.installment_plan}
            onChange={(e) => setForm({ ...form, installment_plan: e.target.value })}
          >
            <option value="Specific Dates">Specific Dates</option>
            <option value="30 Days Apart">30 Days Apart</option>
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">
            {form.installment_plan === "30 Days Apart" ? "First Payment Due *" : "Select Payment Dates Below"}
          </label>
          <input
            type="date"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
            value={form.first_payment_due}
            onChange={(e) => setForm({ ...form, first_payment_due: e.target.value })}
            required={form.installment_plan === "30 Days Apart"}
          />
        </div>
      </div>

      {form.installment_plan === "Specific Dates" && (
        <div className="space-y-3 pt-2">
          <p className="font-body text-xs text-muted-foreground uppercase font-semibold">Payment Due Dates</p>
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Payment {i + 1} Due Date *</label>
              <input
                type="date"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-body"
                value={form.payment_dates[i]}
                onChange={(e) => {
                  const dates = [...form.payment_dates];
                  dates[i] = e.target.value;
                  setForm({ ...form, payment_dates: dates });
                }}
                required
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium"
        >
          Create Plan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-border rounded-full font-body text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function VendorPaymentsTab() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reconcilePayment, setReconcilePayment] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Invoice.filter({ is_vendor_invoice: true }),
      base44.entities.VendorPayment.list("-created_date", 500),
    ]).then(([invs, pmts]) => {
      setInvoices(invs);
      setPayments(pmts);
      setLoading(false);
    });
  }, []);

  const recordPayment = async (paymentId, paidDate) => {
    const payment = payments.find((p) => p.id === paymentId);
    const status =
      new Date(paidDate) <= new Date(payment.due_date) ? "Paid On Time" : "Paid Late";

    await base44.entities.VendorPayment.update(paymentId, {
      paid_date: paidDate,
      status,
    });

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId ? { ...p, paid_date: paidDate, status } : p
      )
    );
    toast.success(`Payment recorded as ${status}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const invoicePayments = (invoiceId) =>
    payments.filter((p) => p.invoice_id === invoiceId);

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await base44.functions.invoke('importVendorInvoices', formData);
      
      if (response.data.status === 'complete') {
        toast.success(response.data.message);
        
        // Refresh data
        Promise.all([
          base44.entities.Invoice.filter({ is_vendor_invoice: true }),
          base44.entities.VendorPayment.list("-created_date", 500),
        ]).then(([invs, pmts]) => {
          setInvoices(invs);
          setPayments(pmts);
        });

        // Show any errors
        if (response.data.errors?.length > 0) {
          toast.error(`${response.data.errors.length} rows failed to import`);
        }
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold">Vendor Invoices & Payments</h3>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 cursor-pointer transition-opacity flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {importing ? "Importing..." : "Import CSV"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              disabled={importing}
              className="hidden"
            />
          </label>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const template = "vendor_name,amount,invoice_date,description\nSupplier Co,1500.00,2026-04-16,Produce order\n";
              const blob = new Blob([template], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'vendor_invoices_template.csv';
              a.click();
            }}
            className="px-4 py-2 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
          >
            Download Template
          </a>
        </div>
      </div>

      {showForm && editingInvoice && (
        <VendorInvoiceForm
          invoice={editingInvoice}
          onSave={() => {
            setShowForm(false);
            setEditingInvoice(null);
            Promise.all([
              base44.entities.Invoice.filter({ is_vendor_invoice: true }),
              base44.entities.VendorPayment.list("-created_date", 500),
            ]).then(([invs, pmts]) => {
              setInvoices(invs);
              setPayments(pmts);
            });
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
        />
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <p className="font-body text-muted-foreground">No vendor invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const invPayments = invoicePayments(inv.id);
            const allPaid = invPayments.every((p) => p.status.includes("Paid"));
            const anyLate = invPayments.some((p) => p.status === "Paid Late");
            const allOnTime = invPayments.every((p) => p.status === "Paid On Time");

            return (
              <div
                key={inv.id}
                className={`bg-card border-l-4 rounded-2xl p-5 ${
                  allPaid && allOnTime
                    ? "border-green-500 bg-green-50/30"
                    : anyLate
                      ? "border-yellow-500 bg-yellow-50/30"
                      : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {allPaid && allOnTime ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : anyLate ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      )}
                      <p className="font-heading font-semibold">{inv.vendor_name}</p>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">
                      Invoice Total: ${Number(inv.total).toFixed(2)}
                    </p>
                  </div>
                  {!invPayments.length && (
                    <button
                      onClick={() => {
                        setEditingInvoice(inv);
                        setShowForm(true);
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-xs font-semibold"
                    >
                      <Plus className="w-3 h-3 inline mr-1" /> Set Up Plan
                    </button>
                  )}
                </div>

                {invPayments.length > 0 && (
                  <div className="space-y-3">
                    {invPayments
                      .sort((a, b) => a.payment_number - b.payment_number)
                      .map((pmt) => (
                        <div
                          key={pmt.id}
                          className={`bg-background border rounded-lg p-3 space-y-2 ${
                            pmt.is_reconciled ? "border-green-300 bg-green-50" :
                            pmt.has_discrepancy ? "border-yellow-300 bg-yellow-50" : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-body text-sm font-semibold">
                                  Payment {pmt.payment_number}: ${Number(pmt.amount).toFixed(2)}
                                </p>
                                {pmt.is_reconciled && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                    ✓ Reconciled
                                  </span>
                                )}
                                {pmt.has_discrepancy && (
                                  <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                    ⚠ Discrepancy
                                  </span>
                                )}
                              </div>
                              <p className="font-body text-xs text-muted-foreground">
                                Due: {new Date(pmt.due_date).toLocaleDateString()}
                              </p>
                            </div>

                            {!pmt.paid_date ? (
                              <input
                                type="date"
                                onChange={(e) =>
                                  recordPayment(pmt.id, e.target.value)
                                }
                                className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white font-body"
                                placeholder="Mark as paid"
                              />
                            ) : (
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <PaymentStatusBadge status={pmt.status} />
                                  <p className="font-body text-xs text-muted-foreground mt-1">
                                    Paid: {new Date(pmt.paid_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setReconcilePayment(pmt)}
                                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-body font-semibold hover:bg-muted transition-colors"
                                >
                                  {pmt.is_reconciled ? "Edit" : "Reconcile"}
                                </button>
                              </div>
                            )}
                          </div>

                          {pmt.has_discrepancy && pmt.discrepancy_notes && (
                            <div className="bg-white rounded px-2 py-1.5 border-l-2 border-yellow-500">
                              <p className="font-body text-xs font-semibold text-yellow-900">
                                Discrepancy: ${Number(pmt.discrepancy_amount || 0).toFixed(2)}
                              </p>
                              <p className="font-body text-xs text-yellow-800 mt-0.5">
                                {pmt.discrepancy_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reconcilePayment && (
        <ReconciliationModal
          payment={reconcilePayment}
          onClose={() => setReconcilePayment(null)}
          onSave={() => {
            setReconcilePayment(null);
            Promise.all([
              base44.entities.Invoice.filter({ is_vendor_invoice: true }),
              base44.entities.VendorPayment.list("-created_date", 500),
            ]).then(([invs, pmts]) => {
              setInvoices(invs);
              setPayments(pmts);
            });
          }}
        />
      )}
    </div>
  );
}