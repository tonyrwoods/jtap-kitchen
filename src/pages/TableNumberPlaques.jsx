import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import { Download, Hash, FileText } from "lucide-react";
import { toast } from "sonner";

// Printable restaurant table-number plaques (1–15). PDF is generated entirely
// client-side with jsPDF so no admin/backend round-trip is required.
export default function TableNumberPlaques() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(15);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    base44.entities.AppSettings.list('-updated_date', 5)
      .then((s) => setSettings(s[0] || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const name = settings?.restaurant_name || "JTAP Kitchen";
  const website = "www.jtapkitchen.com";
  const tagline = "Where Every Bite Tells a Story";
  const numbers = Array.from({ length: count }, (_, i) => i + 1);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const GOLD = [200, 155, 79];
      const DARK = [26, 26, 26];
      const CREAM = [248, 244, 236];
      const MUTED = [110, 110, 110];

      numbers.forEach((n, idx) => {
        if (idx > 0) doc.addPage();
        // Cream page background
        doc.setFillColor(...CREAM);
        doc.rect(0, 0, W, H, "F");

        // Plaque card (4.5in x 6in) centered on the page
        const cardW = 396;
        const cardH = 540;
        const cardX = (W - cardW) / 2;
        const cardY = (H - cardH) / 2;

        // Card fill + gold outer border
        doc.setFillColor(...CREAM);
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(2.5);
        doc.roundedRect(cardX, cardY, cardW, cardH, 12, 12, "FD");

        // Inner thin gold frame
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.75);
        doc.roundedRect(cardX + 14, cardY + 14, cardW - 28, cardH - 28, 6, 6, "S");

        // Gold banner at top of card with restaurant name
        doc.setFillColor(...GOLD);
        doc.roundedRect(cardX + 14, cardY + 14, cardW - 28, 76, 6, 6, "F");
        // Square off the bottom of the banner so it reads as a band
        doc.setFillColor(...GOLD);
        doc.rect(cardX + 14, cardY + 60, cardW - 28, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(name.toUpperCase(), cardX + cardW / 2, cardY + 56, { align: "center" });

        // "TABLE" label
        let y = cardY + 150;
        doc.setTextColor(...MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(18);
        doc.text("TABLE", cardX + cardW / 2, y, { align: "center" });

        // Big table number
        y += 110;
        doc.setTextColor(...DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(150);
        doc.text(String(n).padStart(2, "0"), cardX + cardW / 2, y, { align: "center" });

        // Decorative gold divider
        y += 28;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(1.5);
        doc.line(cardX + cardW / 2 - 50, y, cardX + cardW / 2 + 50, y);

        // Tagline
        y += 40;
        doc.setTextColor(...GOLD);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(15);
        doc.text(tagline, cardX + cardW / 2, y, { align: "center" });

        // Footer website inside the card
        doc.setTextColor(...DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(website, cardX + cardW / 2, cardY + cardH - 30, { align: "center" });
      });

      doc.save("JTAP_Table_Number_Plaques.pdf");
      toast.success("Plaques downloaded");
    } catch (error) {
      toast.error(`Failed to generate plaques: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
          <Hash className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Table Number Plaques</h1>
        <p className="font-body text-muted-foreground max-w-xl mx-auto">
          Printable table-number plaques for {name}. Choose how many tables (up to 15), preview them, then download a
          ready-to-print PDF — one plaque per page.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <label className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
          Number of tables
          <input
            type="number"
            min={1}
            max={15}
            value={count}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (Number.isNaN(v)) return;
              setCount(Math.max(1, Math.min(15, v)));
            }}
            className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-center font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <Download className="w-4 h-4" />
          {generating ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {/* Plaque preview grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {numbers.map((n) => (
          <div
            key={n}
            className="rounded-xl overflow-hidden border-2 border-primary bg-card shadow-sm flex flex-col"
          >
            <div className="bg-primary px-2 py-3 text-center">
              <span className="font-heading text-xs font-bold text-primary-foreground tracking-wider truncate">
                {name.toUpperCase()}
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col items-center justify-center gap-1.5">
              <span className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">Table</span>
              <span className="font-heading text-4xl font-bold text-foreground leading-none">
                {String(n).padStart(2, "0")}
              </span>
              <span className="w-8 h-px bg-primary" />
              <span className="font-body text-[9px] italic text-primary text-center leading-tight">
                Where Every Bite Tells a Story
              </span>
              <span className="font-body text-[9px] font-semibold text-foreground">{website}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span className="font-body text-xs">Each plaque prints on its own letter-size page.</span>
      </div>
    </div>
  );
}