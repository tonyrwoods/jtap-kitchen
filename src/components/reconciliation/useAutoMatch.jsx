/**
 * Auto-matching engine:
 * Compares a bank transaction against vendor payments and invoices
 * by amount and date proximity to assign a confidence level.
 */

const DATE_WINDOW_DAYS = 5; // match within ±5 days

function daysDiff(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.abs((a - b) / (1000 * 60 * 60 * 24));
}

function amountMatch(txnAmount, recordAmount, tolerance = 0.01) {
  return Math.abs(txnAmount - recordAmount) <= tolerance;
}

function scoreMatch(txn, record, recordDate, recordAmount, recordLabel) {
  const sameDollar = amountMatch(txn.amount, recordAmount);
  const days = daysDiff(txn.transaction_date, recordDate);
  const withinWindow = days <= DATE_WINDOW_DAYS;

  if (!sameDollar && !withinWindow) return null;

  let confidence;
  if (sameDollar && days === 0) confidence = "High";
  else if (sameDollar && days <= 2) confidence = "High";
  else if (sameDollar && withinWindow) confidence = "Medium";
  else if (!sameDollar && withinWindow && Math.abs(txn.amount - recordAmount) < 5) confidence = "Low";
  else return null;

  return { confidence, days, label: recordLabel };
}

/**
 * Returns an array of matches for each transaction:
 * { txn, matches: [{ type, id, label, confidence, days }] }
 */
export function autoMatch(transactions, vendorPayments, invoices) {
  return transactions.map(txn => {
    const matches = [];

    // Check vendor payments (debit transactions)
    if (txn.transaction_type === "Debit") {
      vendorPayments.forEach(pmt => {
        if (pmt.reconciliation_status === "Confirmed") return;
        const result = scoreMatch(
          txn,
          pmt,
          pmt.due_date,
          pmt.amount,
          `Payment #${pmt.payment_number} – ${pmt.vendor_name} ($${Number(pmt.amount).toFixed(2)})`
        );
        if (result) {
          matches.push({ type: "vendor_payment", id: pmt.id, ...result });
        }

        // Also try paid_date if present
        if (pmt.paid_date) {
          const result2 = scoreMatch(txn, pmt, pmt.paid_date, pmt.amount,
            `Payment #${pmt.payment_number} – ${pmt.vendor_name} ($${Number(pmt.amount).toFixed(2)})`
          );
          if (result2 && (!matches.find(m => m.id === pmt.id) || result2.days < (matches.find(m => m.id === pmt.id)?.days ?? 999))) {
            const existing = matches.findIndex(m => m.id === pmt.id);
            if (existing >= 0) matches[existing] = { type: "vendor_payment", id: pmt.id, ...result2 };
            else matches.push({ type: "vendor_payment", id: pmt.id, ...result2 });
          }
        }
      });

      // Check invoices (vendor invoices)
      invoices.forEach(inv => {
        const result = scoreMatch(
          txn,
          inv,
          inv.created_date?.split("T")[0] || "",
          inv.total,
          `Invoice – ${inv.vendor_name} ($${Number(inv.total).toFixed(2)})`
        );
        if (result) {
          matches.push({ type: "invoice", id: inv.id, ...result });
        }
      });
    }

    // Sort by confidence desc, then days asc
    const confOrder = { High: 0, Medium: 1, Low: 2 };
    matches.sort((a, b) => confOrder[a.confidence] - confOrder[b.confidence] || a.days - b.days);

    return { txn, matches };
  });
}