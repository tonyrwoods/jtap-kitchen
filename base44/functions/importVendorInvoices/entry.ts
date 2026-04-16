import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have headers and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredFields = ['vendor_name', 'amount'];
  
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      throw new Error(`Missing required column: ${field}`);
    }
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const vendorName = row.vendor_name?.trim();
        const amount = parseFloat(row.amount);
        const description = row.description?.trim() || `${vendorName} Invoice`;
        const invoiceDate = row.invoice_date?.trim() || new Date().toISOString().split('T')[0];

        if (!vendorName || isNaN(amount) || amount <= 0) {
          throw new Error('Invalid vendor_name or amount');
        }

        await base44.asServiceRole.entities.Invoice.create({
          table_number: 0,
          vendor_name: vendorName,
          is_vendor_invoice: true,
          items: [
            {
              name: vendorName,
              quantity: 1,
              unit_price: amount,
              line_total: amount,
            }
          ],
          subtotal: amount,
          tax_amount: 0,
          discount_amount: 0,
          total: amount,
          status: 'Unpaid',
          payment_method: 'Other',
          notes: description,
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    return Response.json({
      status: 'complete',
      message: `Imported ${results.success} invoices${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      ...results,
    });
  } catch (error) {
    console.error('Error in importVendorInvoices:', error);
    return Response.json(
      { error: error.message, status: 'failed' },
      { status: 500 }
    );
  }
});