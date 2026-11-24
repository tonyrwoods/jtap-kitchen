// Auth for the AI receptionist (RestoVoice AI) endpoints.
//
// The receptionist is a separate app, so it cannot present an app-user session.
// It authenticates with a shared key sent in the `x-receptionist-key` header,
// compared in constant time. Signed-in admins are also allowed through — that
// is how the team can test an endpoint from inside this app.
import { secrets } from "base44:runtime";

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function hasReceptionistKey(req) {
  let expected = "";
  try {
    expected = String(secrets.get("RECEPTIONIST_API_KEY") || "").trim();
  } catch {
    return false;
  }
  if (!expected) return false;
  const provided = String(req.headers.get("x-receptionist-key") || "").trim();
  if (!provided) return false;
  return safeEqual(provided, expected);
}

export async function authorizeReceptionist(req, base44) {
  if (hasReceptionistKey(req)) return true;
  const user = await base44.auth.me().catch(() => null);
  return user?.role === "admin";
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}