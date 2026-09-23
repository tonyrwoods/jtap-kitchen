import { jsPDF } from "jspdf";

const FOOD_CATEGORIES = ["Appetizers", "Salads & Sandwiches", "Entrees", "Sides", "Desserts", "Drinks"];
const LIQUOR_SECTIONS = ["Signature Cocktails", "Wine List", "Spirits & Liquors"];

const LOGO_URL = "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/59d7d09ac_JKLOGO_HR.png";

async function loadImageDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmtPrice(n) {
  if (n == null || isNaN(Number(n))) return "";
  return `$${Number(n).toFixed(2)}`;
}

/**
 * Builds a printer-friendly PDF of the food + liquor menus and triggers a download.
 * @param {Array} foodItems  - MenuItem records
 * @param {Array} liquorItems - LiquorMenuItem records
 */
export async function generateMenuPdf(foodItems = [], liquorItems = []) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text, size, lineHeight = 1.4, font = "normal", color = [0, 0, 0]) => {
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentW);
    const lineH = size * lineHeight;
    lines.forEach((line) => {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    });
  };

  const writeCentered = (text, size, lineHeight = 1.4, font = "normal", color = [0, 0, 0]) => {
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentW);
    const lineH = size * lineHeight;
    lines.forEach((line) => {
      ensureSpace(lineH);
      doc.text(line, pageW / 2, y, { align: "center" });
      y += lineH;
    });
  };

  // Logo + Header
  const logoDataUrl = await loadImageDataUrl(LOGO_URL);
  if (logoDataUrl) {
    const logoSize = 50;
    ensureSpace(logoSize + 10);
    doc.addImage(logoDataUrl, "PNG", pageW / 2 - logoSize / 2, y, logoSize, logoSize);
    y += logoSize + 8;
  }
  writeCentered("JTAP Kitchen — Our Menu", 22, 1.2, "bold");
  y += 4;
  writeCentered("Memphis, TN  ·  (901) 213-8085  ·  jtapkitchen.com", 10, 1.3, "normal", [120, 120, 120]);
  y += 14;

  const drawItem = (name, priceText, description, extraLine) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const nameLines = doc.splitTextToSize(name, contentW - 90);
    ensureSpace(16);
    doc.text(nameLines[0], margin, y);
    if (priceText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(priceText, pageW - margin, y, { align: "right" });
    }
    y += 14;
    for (let i = 1; i < nameLines.length; i++) {
      ensureSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(nameLines[i], margin, y);
      y += 14;
    }
    if (description) {
      writeWrapped(description, 9, 1.35, "normal", [70, 70, 70]);
    }
    if (extraLine) {
      writeWrapped(extraLine, 8, 1.3, "italic", [110, 110, 110]);
    }
    y += 8;
  };

  // Food
  const activeFood = foodItems.filter((i) => i && i.name && i.is_active !== false);
  FOOD_CATEGORIES.forEach((cat) => {
    const items = activeFood.filter((i) => i.category === cat);
    if (items.length === 0) return;
    ensureSpace(34);
    writeWrapped(cat.toUpperCase(), 14, 1.2, "bold");
    y += 4;
    items.forEach((item) => {
      const price = item.price != null ? fmtPrice(item.price) : "";
      const tags = Array.isArray(item.dietary_tags) && item.dietary_tags.length
        ? item.dietary_tags.join(" · ")
        : "";
      drawItem(item.name, price, item.description, tags);
    });
    y += 6;
  });

  // Liquor
  const activeLiquor = liquorItems.filter((i) => i && i.name && i.is_active !== false);
  LIQUOR_SECTIONS.forEach((section) => {
    const items = activeLiquor.filter((i) => i.section === section);
    if (items.length === 0) return;
    ensureSpace(34);
    writeWrapped(section.toUpperCase(), 14, 1.2, "bold");
    y += 4;
    items.forEach((item) => {
      const prices = [];
      if (item.price != null) prices.push(fmtPrice(item.price));
      if (item.price_half_pour != null) prices.push(`½ Pour ${fmtPrice(item.price_half_pour)}`);
      if (item.price_full_pour != null) prices.push(`Full Pour ${fmtPrice(item.price_full_pour)}`);
      if (item.price_bottle != null) prices.push(`Bottle ${fmtPrice(item.price_bottle)}`);
      const priceText = prices.length ? prices.join("   ·   ") : "Market Price";
      const flavors = item.flavors ? `Flavors: ${item.flavors}` : "";
      drawItem(item.name, priceText, item.description, flavors);
    });
    y += 6;
  });

  // Footer
  y += 6;
  writeWrapped(
    `Please inform your server of any allergies. Prices subject to change. © ${new Date().getFullYear()} JTAP Kitchen.`,
    8,
    1.3,
    "italic",
    [140, 140, 140]
  );

  doc.save("JTAP-Kitchen-Menu.pdf");
}