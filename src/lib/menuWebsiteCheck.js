// Categories the public website menu (DigitalMenu / Full Menu) actually renders.
export const SITE_CATEGORIES = [
  "Brunch",
  "Brunch Sides",
  "Appetizers",
  "Salads & Sandwiches",
  "Entrees",
  "Lunch",
  "Lunch Sides",
  "Sides",
  "Desserts",
  "Sports Menu",
  "Happy Hour",
];

// Returns why an admin menu row is NOT appearing on the website menu, or null if it is.
export function getWebsiteIssue(row) {
  if (!row || !row.raw) return null;
  if (row.type === "liquor") {
    return row.raw.is_active === false ? "Inactive — hidden from the liquor menu" : null;
  }
  const category = row.raw.category;
  if (!category) return "No category — missing from the website menu";
  if (!SITE_CATEGORIES.includes(category)) return `Category "${category}" is not shown on the website`;
  return null;
}

export const hasPhoto = (row) => Boolean(row?.raw?.image_url);