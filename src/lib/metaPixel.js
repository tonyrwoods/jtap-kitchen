// Meta Pixel (Facebook Pixel) event helper.
// Safely no-ops when the Pixel base code isn't loaded (e.g. script blockers,
// SSR) so app flows never break on a missing window.fbq.
// Pixel ID: 1064707369734001 (base code installed in index.html).

export function trackPixel(event, params = {}) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

export function trackCustomPixel(event, params = {}) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", event, params);
  }
}