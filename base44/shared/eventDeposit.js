export const DEPOSIT_BY_PACKAGE = {
  "Social Gathering": 250,
  "Elevated Experience": 500,
  "Full Buyout": 1000,
};

export function depositForPackage(pkg) {
  return DEPOSIT_BY_PACKAGE[pkg] || 0;
}