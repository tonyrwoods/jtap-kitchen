import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, FileText, UtensilsCrossed, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function AdFlyer() {
  const [settings, setSettings] = useState(null);
  const [dishCount, setDishCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke("generateAdFlyer", {});
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Advertisement Flyer</h1>
        <p className="font-body text-muted-foreground max-w-xl mx-auto">
          A printable brand flyer for {name}. It pulls your featured dishes and contact details live, so it's always
          up to date. Download the PDF and share it in print or online.
        </p>
      </div>

      {/* Flyer preview card */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
        {/* Gold banner */}
        <div className="bg-primary px-6 py-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-primary-foreground tracking-wider">
            {name.toUpperCase()}
          </h2>
        </div>
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
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <QrCode className="w-10 h-10 text-muted-foreground/40" />
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