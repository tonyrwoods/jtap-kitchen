import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, FileText, UtensilsCrossed, MapPin, QrCode, ImagePlus, Upload, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

// Reads a file, downscales it to fit maxDim, and returns a data URL + dimensions.
// Logos are kept as PNG (transparency); backgrounds as JPEG (smaller payload).
async function processImage(file, maxDim, asPng) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const out = asPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
  return { dataUrl: out, w, h };
}

export default function AdFlyer() {
  const [settings, setSettings] = useState(null);
  const [dishCount, setDishCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [logo, setLogo] = useState(null); // { dataUrl, w, h }
  const [bg, setBg] = useState(null); // { dataUrl, w, h }
  const logoInputRef = useRef(null);
  const bgInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.AppSettings.list('-updated_date', 5),
      base44.entities.FeaturedDish.filter({ is_active: true }),
    ])
      .then(([s, d]) => {
        setSettings(s[0] || null);
        setDishCount(d.length);
      })
      .catch(() => toast.error("Could not load brand info"))
      .finally(() => setLoading(false));
  }, []);

  const onLogo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await processImage(f, 400, true);
      setLogo(res);
      toast.success("Logo added");
    } catch {
      toast.error("Could not read logo");
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const onBg = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await processImage(f, 1400, false);
      setBg(res);
      toast.success("Background image added");
    } catch {
      toast.error("Could not read image");
    } finally {
      if (bgInputRef.current) bgInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke("generateAdFlyer", {
        logo: logo?.dataUrl || null,
        logo_w: logo?.w || 0,
        logo_h: logo?.h || 0,
        background: bg?.dataUrl || null,
        bg_w: bg?.w || 0,
        bg_h: bg?.h || 0,
      });
      if (response.data) {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "JTAP_Kitchen_Flyer.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Flyer downloaded");
      } else {
        toast.error("Could not generate flyer");
      }
    } catch (error) {
      toast.error(`Failed to generate flyer: ${error.message}`);
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

  const name = settings?.restaurant_name || "JTAP Kitchen";
  const address = settings?.address || "Memphis, TN";
  const menuUrl = `${window.location.origin}/menu`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Advertisement Flyer</h1>
        <p className="font-body text-muted-foreground max-w-xl mx-auto">
          A printable brand flyer for {name}. It pulls your featured dishes and contact details live, so it's always
          up to date. Add your logo and a background image, then download the PDF.
        </p>
      </div>

      {/* Upload controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Logo upload */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <ImagePlus className="w-4 h-4" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Logo</h3>
          </div>
          {logo ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 border border-border rounded-lg overflow-hidden flex items-center justify-center bg-muted/40">
                <img src={logo.dataUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              </div>
              <button
                onClick={() => setLogo(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-1 py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="font-body text-xs">Upload logo (PNG)</span>
            </button>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
        </div>

        {/* Background upload */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <ImagePlus className="w-4 h-4" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Background Image</h3>
          </div>
          {bg ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 border border-border rounded-lg overflow-hidden">
                <img src={bg.dataUrl} alt="Background preview" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setBg(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => bgInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-1 py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="font-body text-xs">Upload background (JPG)</span>
            </button>
          )}
          <input ref={bgInputRef} type="file" accept="image/*" onChange={onBg} className="hidden" />
        </div>
      </div>

      {/* Flyer preview card */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
        {/* Gold banner with logo or name */}
        <div className="bg-primary px-6 py-8 text-center">
          {logo ? (
            <img src={logo.dataUrl} alt={name} className="h-14 mx-auto object-contain" />
          ) : (
            <h2 className="font-heading text-2xl font-bold text-primary-foreground tracking-wider">
              {name.toUpperCase()}
            </h2>
          )}
        </div>

        {/* Optional background hero strip */}
        {bg && (
          <div className="h-32 w-full overflow-hidden">
            <img src={bg.dataUrl} alt="Background" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 space-y-5">
          <p className="text-center font-body text-sm text-muted-foreground">
            Seasonal Small Plates · Craft Cocktails · {address}
          </p>

          {/* Menu highlights preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <UtensilsCrossed className="w-4 h-4" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Menu Highlights</h3>
            </div>
            <p className="font-body text-xs text-muted-foreground">
              {dishCount > 0
                ? `${dishCount} featured dish${dishCount === 1 ? "" : "s"} will be listed with name, description, and price.`
                : "Add featured dishes in the admin dashboard to populate this section."}
            </p>
          </div>

          {/* Visit us preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="w-4 h-4" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Visit Us</h3>
              </div>
              <p className="font-body text-xs text-muted-foreground">{address}</p>
              {settings?.opening_time && settings?.closing_time && (
                <p className="font-body text-xs text-muted-foreground">
                  Hours: {settings.opening_time}–{settings.closing_time}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <QrCode className="w-4 h-4" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Scan to View Menu</h3>
              </div>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-white p-1">
                <QRCodeSVG value={menuUrl} size={80} level="M" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <Download className="w-4 h-4" />
          {generating ? "Generating…" : "Download PDF Flyer"}
        </button>
      </div>
    </div>
  );
}