import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.0.0';
import QRCode from 'npm:qrcode@1.5.4';

// Generates a printable brand advertisement flyer for JTAP Kitchen as a PDF.
// Admin-only: a marketing asset meant to be printed / shared by staff.
// Content is pulled live from AppSettings + FeaturedDish so it never goes stale.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const logo = body.logo || null;
    const logoW = Number(body.logo_w) || 0;
    const logoH = Number(body.logo_h) || 0;
    const background = body.background || null;
    const bgW = Number(body.bg_w) || 0;
    const bgH = Number(body.bg_h) || 0;
    const qr = body.qr || null;
    const qrW = Number(body.qr_w) || 0;
    const qrH = Number(body.qr_h) || 0;

    const [settings, dishes] = await Promise.all([
      base44.asServiceRole.entities.AppSettings.list('-updated_date', 5),
      base44.asServiceRole.entities.FeaturedDish.filter({ is_active: true }, 'sort_order', 8),
    ]);
    const s = settings[0] || {};
    const restaurantName = s.restaurant_name || 'JTAP Kitchen';
    const address = s.address || 'Memphis, TN';
    const phone = s.contact_phone || '';
    const email = s.contact_email || '';
    const hours = 'Wed\u2013Thu 5:00pm\u201310:00pm  \u00b7  Fri\u2013Sat 5:00pm\u201311:00pm  \u00b7  Sun Brunch 10:00am\u20133:00pm';
    const appUrl = (Deno.env.get('APP_URL') || 'https://jtapkitchen.com').replace(/\/$/, '');
    const menuUrl = `${appUrl}/menu`;

    // Brand palette (RGB)
    const GOLD = [200, 155, 79];
    const DARK = [26, 26, 26];
    const CREAM = [248, 244, 236];
    const MUTED = [110, 110, 110];
    const LINE = [220, 215, 205];

    // QR code (scan to view digital menu)
    let qrDataUrl: string | null = null;
    try {
      qrDataUrl = await QRCode.toDataURL(menuUrl, {
        margin: 2,
        width: 300,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      });
    } catch (e) {
      console.error('QR generation failed:', e.message);
    }

    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 44;

    // Cream background (base)
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, W, H, 'F');

    // Optional full-page background image (cover) with a cream overlay for readability
    if (background && bgW > 0 && bgH > 0) {
      try {
        const scale = Math.max(W / bgW, H / bgH);
        const dw = bgW * scale;
        const dh = bgH * scale;
        doc.addImage(background, 'JPEG', (W - dw) / 2, (H - dh) / 2, dw, dh);
        try {
          doc.setGState(new doc.GState({ opacity: 0.84 }));
          doc.setFillColor(...CREAM);
          doc.rect(0, 0, W, H, 'F');
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (gsErr) {
          console.error('GState overlay failed:', gsErr.message);
        }
      } catch (imgErr) {
        console.error('Background image embed failed:', imgErr.message);
      }
    }
    // Always restore full opacity before drawing any content (banner, text, QR)
    try { doc.setGState(new doc.GState({ opacity: 1 })); } catch (_) {}

    // Top gold banner
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, W, 96, 'F');

    // Logo (if provided) centered in the banner; otherwise the restaurant name
    if (logo && logoW > 0 && logoH > 0) {
      const maxH = 64, maxW = 260;
      const sc = Math.min(maxH / logoH, maxW / logoW);
      const lw = logoW * sc, lh = logoH * sc;
      try {
        doc.addImage(logo, 'PNG', (W - lw) / 2, (96 - lh) / 2, lw, lh);
      } catch (logoErr) {
        console.error('Logo embed failed:', logoErr.message);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.text(restaurantName.toUpperCase(), W / 2, 60, { align: 'center' });
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.text(restaurantName.toUpperCase(), W / 2, 60, { align: 'center' });
    }

    // Tagline
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(15);
    doc.text('Where Every Bite Tells a Story', W / 2, 122, { align: 'center' });
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Seasonal Small Plates  \u00b7  Craft Cocktails  \u00b7  Memphis, TN', W / 2, 140, { align: 'center' });

    let y = 172;

    // Brand statement
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    const statement =
      'A neighborhood kitchen celebrating bold flavors, local ingredients, and the art of gathering. Join us for an unforgettable dining experience.';
    const wrapped = doc.splitTextToSize(statement, W - 2 * M);
    doc.text(wrapped, W / 2, y, { align: 'center' });
    y += wrapped.length * 16 + 26;

    // Menu Highlights heading
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MENU HIGHLIGHTS', W / 2, y, { align: 'center' });
    y += 8;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.5);
    doc.line(W / 2 - 60, y, W / 2 + 60, y);
    y += 26;

    // Dishes (cap at 5 so the layout never overflows)
    doc.setFontSize(11);
    for (const d of dishes.slice(0, 5)) {
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(d.name || '', M, y);
      if (d.price) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GOLD);
        doc.text(`$${Number(d.price).toFixed(0)}`, W - M, y, { align: 'right' });
      }
      y += 15;
      if (d.description) {
        doc.setTextColor(...MUTED);
        doc.setFont('helvetica', 'italic');
        const desc = doc.splitTextToSize(d.description, W - 2 * M);
        doc.text(desc, M, y);
        y += desc.length * 13 + 8;
      } else {
        y += 6;
      }
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(M, y, W - M, y);
      y += 14;
    }

    // Visit Us section
    y += 12;
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('VISIT US', W / 2, y, { align: 'center' });
    y += 8;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.5);
    doc.line(W / 2 - 50, y, W / 2 + 50, y);
    y += 24;

    // Contact details (left) + QR code (right)
    const contactStartY = y;
    const qrSize = 92;
    const qrX = W - M - qrSize;
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('JTAP Kitchen', M, y);
    y += 16;
    doc.setFontSize(11);
    doc.text('3397 Summer Ave, Memphis, TN 38122', M, y);
    y += 16;
    if (hours) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      const hoursLines = doc.splitTextToSize(`Hours: ${hours}`, 400);
      doc.text(hoursLines, M, y);
      y += hoursLines.length * 14 + 3;
    }
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('901-213-8085', M, y);
    y += 16;
    doc.setTextColor(...GOLD);
    doc.text('www.jtapkitchen.com', M, y);

    const qrImg = qr || qrDataUrl;
    if (qrImg) {
      // Solid white backing so the QR stays high-contrast over any background image
      const pad = 6;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - pad, contactStartY - pad, qrSize + pad * 2, qrSize + pad * 2, 6, 6, 'F');
      doc.addImage(qrImg, 'PNG', qrX, contactStartY, qrSize, qrSize);
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Scan to view menu', qrX + qrSize / 2, contactStartY + qrSize + 14, { align: 'center' });
    }

    // Footer band
    doc.setFillColor(...DARK);
    doc.rect(0, H - 52, W, 52, 'F');
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Reserve at ${appUrl.replace(/^https?:\/\//, '')}/book`, W / 2, H - 22, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="JTAP_Kitchen_Flyer.pdf"`,
      },
    });
  } catch (error) {
    console.error('Flyer generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});