import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Complementary Items Suggester — AI pairing engine that suggests specific
// sides, desserts, and drinks from the live menu to complement what a guest is
// already ordering/finalizing. Public (guests at checkout/reservation). Narrow
// app op: builds the prompt server-side, validates inputs, returns matched
// items only. One bounded LLM call per request.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let body = {};
  try { body = await req.json(); } catch {}

  const contextItems = Array.isArray(body.context_items)
    ? body.context_items.map((n) => String(n || "")).filter(Boolean).slice(0, 20)
    : [];
  const partySize = Math.min(Math.max(parseInt(body.party_size) || 2, 1), 99);
  const flow = body.flow === "event" ? "event" : "reservation";

  // Complementary categories only (sides, desserts, drinks, appetizers, wine, cocktails)
  const FOOD_CATS = ["Sides", "Desserts", "Drinks", "Appetizers", "Lunch Sides"];
  const menu = await base44.asServiceRole.entities.MenuItem.list("-created_date", 200);
  const liquor = await base44.asServiceRole.entities.LiquorMenuItem.list("-created_date", 200);

  const foodCandidates = menu.filter((m) => FOOD_CATS.includes(m.category));
  const liquorCandidates = liquor.filter((l) => l.is_active && ["Signature Cocktails", "Wine List"].includes(l.section));

  const foodList = foodCandidates.map((m) => `- ${m.name} (${m.category}, $${Number(m.price).toFixed(2)})`);
  const liquorList = liquorCandidates.map((l) => {
    const price = l.section === "Wine List"
      ? (l.price_full_pour ? `$${Number(l.price_full_pour).toFixed(2)}/glass` : l.price_bottle ? `$${Number(l.price_bottle).toFixed(0)}/bottle` : "")
      : (l.price ? `$${Number(l.price).toFixed(2)}` : "");
    return `- ${l.name} (${l.section}${price ? ", " + price : ""})`;
  });

  const candidates = [...foodList, ...liquorList].slice(0, 120);
  if (candidates.length === 0) return Response.json({ suggestions: [] });

  const contextLine = contextItems.length > 0
    ? `The guest has already selected these dishes:\n${contextItems.map((n) => `- ${n}`).join("\n")}`
    : "The guest has not selected any specific dishes yet.";

  const prompt = `You are a knowledgeable server at JTAP Kitchen, a refined small-plates restaurant in Memphis. A guest is finalizing their ${flow === "event" ? "private event booking" : "table reservation"} for a party of ${partySize}.

${contextLine}

Suggest 3 complementary items from the menu below that would round out their experience — pair well with their selections (or, if none selected, popular pairings for a party of ${partySize}). Prioritize variety across sides, desserts, and drinks; avoid suggesting three items from the same category.

Available complementary items:
${candidates.join("\n")}

Return ONLY a JSON object with an "items" array of 3 objects, each with "name" (the exact item name from the list above) and "reason" (one short sentence, ≤120 chars, explaining why it pairs well). No prose outside the JSON.`;

  let suggestions = [];
  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, reason: { type: "string" } },
              required: ["name", "reason"],
            },
          },
        },
        required: ["items"],
      },
    });
    const arr = Array.isArray(result?.items) ? result.items : [];
    const nameMap = new Map();
    foodCandidates.forEach((m) => nameMap.set(m.name.toLowerCase().trim(), { ...m, _source: "food" }));
    liquorCandidates.forEach((l) => nameMap.set(l.name.toLowerCase().trim(), { ...l, _source: "liquor" }));

    for (const item of arr) {
      const key = String(item.name || "").toLowerCase().trim();
      const match = nameMap.get(key);
      if (!match) continue;
      if (match._source === "food") {
        suggestions.push({
          id: match.id, name: match.name, category: match.category,
          price: Number(match.price) || 0, description: match.description || "",
          image_url: match.image_url || "", source: "food", reason: String(item.reason || ""),
        });
      } else {
        const price = match.section === "Wine List"
          ? (match.price_full_pour ? Number(match.price_full_pour) : match.price_bottle ? Number(match.price_bottle) : 0)
          : (match.price ? Number(match.price) : 0);
        suggestions.push({
          id: match.id, name: match.name, category: match.section,
          price, description: match.description || "",
          image_url: "", source: "liquor", reason: String(item.reason || ""),
        });
      }
      if (suggestions.length >= 3) break;
    }
  } catch (err) {
    console.error("suggestComplementaryItems LLM error:", err);
  }

  return Response.json({ suggestions });
});