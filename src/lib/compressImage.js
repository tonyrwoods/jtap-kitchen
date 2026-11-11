// Shrinks an image in the browser before it is uploaded, so menu photos stay
// small and the menu page loads fast. Phone photos often arrive at 4-8 MB;
// downscaling to 1200px wide JPEG brings them to well under 200 KB.
//
// Returns a new File when the image was made smaller, otherwise the original.

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.82;

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path (e.g. browsers that can't decode it here)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default async function compressImage(file) {
  if (!file || !file.type?.startsWith("image/")) return file;

  try {
    const source = await loadBitmap(file);
    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    if (!sourceWidth || !sourceHeight) return file;

    const scale = Math.min(1, MAX_WIDTH / sourceWidth);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(source, 0, 0, width, height);
    if (typeof source.close === "function") source.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    // Keep the original when compression made no improvement (small or already-tight files)
    if (!blob || blob.size >= file.size) return file;

    const name = `${(file.name || "image").replace(/\.[^.]+$/, "")}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}