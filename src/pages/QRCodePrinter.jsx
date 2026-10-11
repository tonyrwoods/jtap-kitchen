import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { base44 } from "@/api/base44Client";
import { Download, Printer, Plus, Minus } from "lucide-react";

const BASE_URL = window.location.origin;

function QRCard({ tableNum, url }) {
  const svgRef = useRef(null);

  const downloadPNG = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svg);
    if (!/xmlns=/.test(svgStr)) svgStr = svgStr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 360);
      ctx.drawImage(img, 25, 20, 250, 250);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 18px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(`Table ${tableNum}`, 150, 300);
      ctx.font = "13px Inter, sans-serif";
      ctx.fillStyle = "#888888";
      ctx.fillText("Scan to view bill & pay", 150, 325);
      canvas.toBlob(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `table-${tableNum}-qr.png`;
        a.click();
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(String.fromCharCode(...new TextEncoder().encode(svgStr)));
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3 print:break-inside-avoid">
      <p className="font-heading text-lg font-bold">Table {tableNum}</p>
      <div ref={svgRef} className="p-3 bg-white rounded-xl border border-border">
        <QRCodeSVG
          value={url}
          size={160}
          fgColor="#1a1a1a"
          bgColor="#ffffff"
          level="M"
        />
      </div>
      <p className="font-body text-xs text-muted-foreground text-center max-w-[160px] break-all">{url}</p>
      <button
        onClick={downloadPNG}
        className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-full font-body text-xs font-medium hover:bg-muted transition-colors print:hidden"
      >
        <Download className="w-3.5 h-3.5" /> Download PNG
      </button>
    </div>
  );
}

export default function QRCodePrinter() {
  const [tableCount, setTableCount] = useState(10);
  const [tokens, setTokens] = useState({});

  // Fetch per-table HMAC tokens so QR codes link to the secure pay-at-table page
  useEffect(() => {
    const nums = Array.from({ length: tableCount }, (_, i) => i + 1);
    base44.functions.invoke("generateTableToken", { table_numbers: nums })
      .then((res) => setTokens(res.data?.tokens || {}))
      .catch(() => setTokens({}));
  }, [tableCount]);

  const payUrl = (table) => tokens[table]
    ? `${BASE_URL}/pay-at-table?table=${table}&token=${tokens[table]}`
    : `${BASE_URL}/pay-at-table?table=${table}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-5 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Table QR Codes</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Each QR links guests to the pay-at-table page for their table</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2">
              <button onClick={() => setTableCount(c => Math.max(1, c - 1))} className="hover:text-primary transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-body text-sm font-medium w-16 text-center">{tableCount} tables</span>
              <button onClick={() => setTableCount(c => Math.min(50, c + 1))} className="hover:text-primary transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-all"
            >
              <Printer className="w-4 h-4" /> Print All
            </button>
            <a href="/admin" className="font-body text-sm text-primary hover:underline">← Admin</a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-4 print:hidden">
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-primary text-lg">📱</span>
          <div>
            <p className="font-body text-sm font-medium">How it works</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Guests scan the QR code at their table and are taken directly to the pay-at-table page at <code className="bg-muted px-1 rounded">/pay-at-table?table=N&token=…</code> where they can view their bill and pay from their phone. Print and place the codes at each table.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => (
            <QRCard key={n} tableNum={n} url={payUrl(n)} />
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}