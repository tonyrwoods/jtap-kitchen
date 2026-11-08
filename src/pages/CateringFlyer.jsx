import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { CATERING_ORDER_URL } from "@/lib/ordering";

// Printable / downloadable ezCater co-branded flyer. Rendered at a fixed
// 1080x1350 (Instagram portrait) canvas and scaled down to fit the screen so
// the PNG download stays crisp.

const FLYER_W = 1080;
const FLYER_H = 1350;

const BROWN = "#261d1a";
const CREAM = "#f2efe8";
const ORANGE = "#f59e42";

const IMAGES = {
  main: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/3bc69e45d_generated_image.png",
  mac: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/fae363bb6_generated_image.png",
  broccoli: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/8df0d3d7e_generated_image.png",
  logo: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/941e8439b_jkap-logo.jpg",
};

export default function CateringFlyer() {
  const wrapRef = useRef(null);
  const flyerRef = useRef(null);
  const qrWrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / FLYER_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDownload = async () => {
    if (!flyerRef.current) return;
    setDownloading(true);
    const node = flyerRef.current;
    const prevTransform = node.style.transform;
    node.style.transform = "none";
    try {
      const canvas = await html2canvas(node, {
        width: FLYER_W,
        height: FLYER_H,
        scale: 1,
        useCORS: true,
        backgroundColor: BROWN,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "JTAP-Kitchen-ezcater-flyer.png";
      a.click();
      toast.success("Flyer downloaded");
    } catch {
      toast.error("Could not generate the flyer image");
    } finally {
      node.style.transform = prevTransform;
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="max-w-[1080px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Catering Flyer</h1>
            <p className="font-body text-sm text-muted-foreground">
              ezCater office-catering promo — download for Instagram/Facebook or print for the host stand.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Download className="w-4 h-4" /> {downloading ? "Preparing…" : "Download PNG"}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div ref={wrapRef} className="w-full" style={{ height: FLYER_H * scale }}>
          <div
            ref={flyerRef}
            style={{
              width: FLYER_W,
              height: FLYER_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              backgroundColor: BROWN,
              color: CREAM,
              fontFamily: "Inter, Helvetica, Arial, sans-serif",
              display: "flex",
              flexDirection: "column",
              padding: 64,
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <img
                  src={IMAGES.logo}
                  alt="JTAP Kitchen logo"
                  crossOrigin="anonymous"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(242,239,232,0.25)",
                  }}
                />
                <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.14em" }}>JTAP KITCHEN</span>
              </div>
              <span
                style={{
                  backgroundColor: ORANGE,
                  color: "#12100e",
                  borderRadius: 999,
                  padding: "14px 30px",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
              >
                NOW ON ezCATER
              </span>
            </div>

            {/* Headline */}
            <div style={{ marginTop: 56 }}>
              <div style={{ fontSize: 100, fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
                OFFICE CATERING,
              </div>
              <div style={{ fontSize: 100, fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.02em", color: ORANGE }}>
                DONE RIGHT.
              </div>
              <p style={{ marginTop: 28, fontSize: 27, lineHeight: 1.5, color: "rgba(242,239,232,0.72)", maxWidth: 660 }}>
                Planning a company lunch or client meeting? Impress your guests with Memphis-made comfort
                food, delivered to your office.
              </p>
            </div>

            {/* Imagery */}
            <div style={{ display: "flex", gap: 20, marginTop: 40, flex: 1, minHeight: 0 }}>
              <img
                src={IMAGES.main}
                alt="Ragin' Chicken Pasta"
                crossOrigin="anonymous"
                style={{ flex: 1.35, minWidth: 0, height: "100%", objectFit: "cover", borderRadius: 20 }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
                <img
                  src={IMAGES.mac}
                  alt="Smoked Gouda Mac & Cheese"
                  crossOrigin="anonymous"
                  style={{ flex: 1, minHeight: 0, width: "100%", objectFit: "cover", borderRadius: 20 }}
                />
                <img
                  src={IMAGES.broccoli}
                  alt="Gourmet sides"
                  crossOrigin="anonymous"
                  style={{ flex: 1, minHeight: 0, width: "100%", objectFit: "cover", borderRadius: 20 }}
                />
              </div>
            </div>

            {/* Menu items */}
            <div
              style={{
                marginTop: 32,
                fontSize: 27,
                fontWeight: 700,
                letterSpacing: "0.01em",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span>Ragin' Chicken Pasta</span>
              <span style={{ color: ORANGE }}>•</span>
              <span>Southern Fried Catfish</span>
              <span style={{ color: ORANGE }}>•</span>
              <span>Gourmet Sides</span>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 34,
                paddingTop: 30,
                borderTop: "1px solid rgba(242,239,232,0.18)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 32,
              }}
            >
              <div>
                <div style={{ fontSize: 27, fontWeight: 700, marginBottom: 10 }}>
                  Easy ordering. On-time delivery.
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: ORANGE, marginBottom: 12 }}>
                  Call 901-213-8085
                </div>
                <div style={{ fontSize: 21, color: "rgba(242,239,232,0.6)", marginBottom: 8 }}>
                  ezcater.com/catering/jtap-kitchen-3
                </div>
                <div style={{ fontSize: 19, color: "rgba(242,239,232,0.4)" }}>
                  3397 Summer Ave, Memphis · jtapkitchen.com
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: `5px solid ${ORANGE}`,
                  borderRadius: 16,
                  padding: "14px 14px 10px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <div ref={qrWrapRef} style={{ width: 150, height: 150 }}>
                  <QRCodeCanvas value={CATERING_ORDER_URL} size={150} level="M" bgColor="#ffffff" fgColor="#12100e" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#12100e", letterSpacing: "0.1em", marginTop: 8 }}>
                  SCAN TO ORDER
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}