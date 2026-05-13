import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return Response.json({ error: 'invoice_id required' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.read(invoice_id);
    if (!invoice || !invoice.is_vendor_invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    // Header
    doc.setFontSize(20);
    doc.text('Invoice', 20, yPos);
    yPos += 12;

    doc.setFontSize(10);
    doc.text(`Vendor: ${invoice.vendor_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Invoice Total: $${Number(invoice.total).toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Status: ${invoice.status}`, 20, yPos);
    yPos += 8;

    // Line Items
    doc.setFontSize(11);
    doc.text('Line Items', 20, yPos);
    yPos += 8;

    doc.setFontSize(9);
    const columns = ['Item', 'Qty', 'Unit Price', 'Total'];
    const columnWidths = [80, 20, 35, 35];
    let xPos = 20;

    // Header row
    doc.setFont(undefined, 'bold');
    columns.forEach((col, i) => {
      doc.text(col, xPos, yPos);
      xPos += columnWidths[i];
    });
    yPos += 6;

    // Items
    doc.setFont(undefined, 'normal');
    invoice.items?.forEach((item) => {
      xPos = 20;
      doc.text(item.name.substring(0, 30), xPos, yPos);
      xPos += columnWidths[0];
      doc.text(item.quantity.toString(), xPos, yPos);
      xPos += columnWidths[1];
      doc.text(`$${Number(item.unit_price).toFixed(2)}`, xPos, yPos);
      xPos += columnWidths[2];
      doc.text(`$${Number(item.line_total).toFixed(2)}`, xPos, yPos);
      yPos += 6;
    });

    yPos += 4;

    // Summary
    doc.setFont(undefined, 'bold');
    doc.text(`Subtotal: $${Number(invoice.subtotal).toFixed(2)}`, 20, yPos);
    yPos += 6;

    if (invoice.discount_amount > 0) {
      doc.text(`Discount: -$${Number(invoice.discount_amount).toFixed(2)}`, 20, yPos);
      yPos += 6;
    }

    if (invoice.tax_amount > 0) {
      doc.text(`Tax: $${Number(invoice.tax_amount).toFixed(2)}`, 20, yPos);
      yPos += 6;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(`Total: $${Number(invoice.total).toFixed(2)}`, 20, yPos);
    yPos += 10;

    // Documents section
    if (invoice.documents?.length > 0) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Attached Documents', 20, yPos);
      yPos += 6;

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      invoice.documents.forEach((doc_item) => {
        doc.text(`• ${doc_item.type}: ${doc_item.name} (${doc_item.uploaded_date})`, 25, yPos);
        yPos += 5;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, pageHeight - 10);

    // Return PDF as response
    const pdfBuffer = doc.output('arraybuffer');
    const fileName = `${invoice.vendor_name.replace(/\s+/g, '_')}_invoice.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json(
      { error: error.message, status: 'failed' },
      { status: 500 }
    );
  }
});