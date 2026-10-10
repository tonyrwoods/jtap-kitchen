// Admin-only: generates AI food photos for menu items that have no image.
// Processes a small batch per call (default 5) to stay within the function
// timeout. Call repeatedly to work through the full backlog.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

export default async function (req: Request) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit) || 5, 10);
    const categoryFilter = body.category || null;

    // Find items without an image, optionally scoped to one category.
    const query: any = { image_url: { $exists: false } };
    if (categoryFilter) query.category = categoryFilter;
    // Also catch items where image_url is null or empty string
    const page = await base44.asServiceRole.entities.MenuItem.filter(
      { $or: [{ image_url: { $exists: false } }, { image_url: null }, { image_url: "" }], ...(categoryFilter ? { category: categoryFilter } : {}) },
      { sort: "-created_date", limit: 100, fields: ["name", "description", "category", "price", "image_url"] }
    );
    const candidates = (page.items || []).slice(0, limit);

    if (candidates.length === 0) {
      return Response.json({ success: true, message: "No items need images", generated: 0 });
    }

    const results: any[] = [];
    for (const item of candidates) {
      try {
        const prompt = buildPrompt(item);
        const genResult = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        const imageUrl = genResult?.url;
        if (imageUrl) {
          await base44.asServiceRole.entities.MenuItem.update(item.id, { image_url: imageUrl, image_ai_generated: true });
          results.push({ id: item.id, name: item.name, status: "ok", url: imageUrl });
        } else {
          results.push({ id: item.id, name: item.name, status: "no_url" });
        }
      } catch (err: any) {
        results.push({ id: item.id, name: item.name, status: "error", error: err?.message || String(err) });
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    return Response.json({ success: true, generated: ok, total: candidates.length, results });
  } catch (err: any) {
    console.error("generateMenuItemImages error:", err);
    return Response.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

function buildPrompt(item: any): string {
  const name = item.name || "a restaurant dish";
  const desc = item.description || "";
  const cat = item.category || "";
  const isSide = /sides|fries|grits|beans|corn|broccoli|onion rings|toast|eggs|bacon|sausage|fruit|cinnamon|donuts/i.test(name);
  const style = isSide
    ? "simple side dish in a small bowl or plate, overhead angle, on a clean neutral surface"
    : "beautifully plated restaurant dish, professional food photography, soft natural lighting, shallow depth of field, on an elegant ceramic plate, dark moody background";
  return `Professional food photography of ${name}${desc ? ` — ${desc}` : ""}. ${style}. Appetizing, high-end restaurant presentation, vibrant colors, sharp focus, no text, no watermark.`;
}