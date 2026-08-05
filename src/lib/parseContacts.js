// Parses a pasted block of contacts into [{ name, email }]
// Accepts one contact per line in any of these formats:
//   "Name, email"
//   "Name <email>"
//   "email"
//   "email, Name"
// Lines may also be separated by semicolons.
export function parseContacts(text) {
  if (!text) return [];
  const lines = String(text).split(/[\n;]/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (!emailMatch) continue;
    const email = emailMatch[0].toLowerCase();
    let name = line
      .replace(emailMatch[0], "")
      .replace(/[<>,"']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name) name = email.split("@")[0];
    out.push({ name, email });
  }
  // Dedupe by email
  const seen = new Set();
  return out.filter((c) => (seen.has(c.email) ? false : (seen.add(c.email), true)));
}