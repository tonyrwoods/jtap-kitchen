import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { trackPixel } from "@/lib/metaPixel";

// Default destination after capturing the click — reservations are the
// primary conversion KPI, so paid traffic lands on the booking page.
const DEST_DEFAULT = "/book";

export default function AdLanding() {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get("gclid") || "";
    const source = params.get("utm_source") || "google";
    const medium = params.get("utm_medium") || "cpc";
    const campaign = params.get("utm_campaign") || params.get("campaignid") || "";
    const content = params.get("utm_content") || params.get("adgroupid") || "";
    const term = params.get("utm_term") || params.get("keyword") || "";
    const matchtype = params.get("matchtype") || "";
    const device = params.get("device") || "";
    const dest = params.get("dest") || DEST_DEFAULT;

    // Persist click attribution so downstream conversion flows can attach the gclid.
    try {
      sessionStorage.setItem(
        "jtap_ad_attribution",
        JSON.stringify({
          gclid,
          source,
          medium,
          campaign,
          content,
          term,
          matchtype,
          device,
          landed_at: new Date().toISOString(),
        })
      );
    } catch {}

    // Analytics: record the paid acquisition landing.
    base44.analytics.track({
      eventName: "google_ad_click_landing",
      properties: {
        gclid: gclid || null,
        source,
        medium,
        campaign: campaign || null,
        content: content || null,
        term: term || null,
        matchtype: matchtype || null,
        device: device || null,
        dest,
      },
    });

    // Meta Pixel: treat the paid click as a Lead for retargeting/optimization.
    trackPixel("Lead", {
      content_name: "Google Ad Click",
      content_category: "Paid Acquisition",
      value: 0,
      currency: "USD",
    });

    setRedirecting(true);
    const t = setTimeout(() => navigate(dest, { replace: true }), 1200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3">JTAP Kitchen</p>
      <h1 className="font-heading text-3xl font-semibold mb-3">Welcome</h1>
      <p className="font-body text-muted-foreground mb-6 max-w-sm">
        Taking you to your table{redirecting ? "…" : ""}
      </p>
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}