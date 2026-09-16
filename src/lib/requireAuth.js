import { base44 } from "@/api/base44Client";

// Returns the current user if authenticated. Otherwise redirects to the
// platform login page with a nextUrl back to the current page, then returns
// null — callers should `return` immediately on null so the submit is aborted.
export async function requireAuthOrRedirect() {
  const authed = await base44.auth.isAuthenticated();
  if (!authed) {
    const nextUrl = window.location.pathname + window.location.search + window.location.hash;
    await base44.auth.redirectToLogin(nextUrl);
    return null;
  }
  try {
    return await base44.auth.me();
  } catch (_) {
    const nextUrl = window.location.pathname + window.location.search + window.location.hash;
    await base44.auth.redirectToLogin(nextUrl);
    return null;
  }
}