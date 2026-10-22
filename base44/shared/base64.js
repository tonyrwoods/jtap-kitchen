/**
 * UTF-8-safe Base64 helpers.
 *
 * The global btoa() only accepts Latin1 (char codes 0–255) and throws on any
 * character outside that range — e.g. the em-dash, curly quotes or emoji that
 * appear in generated email bodies and .ics calendar files. These helpers
 * encode the string's UTF-8 bytes first, so any Unicode content works.
 */

/** Encode a UTF-8 string as standard Base64. */
export function base64FromUtf8(str) {
  const bytes = new TextEncoder().encode(String(str ?? ''));
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Base64url-encode a UTF-8 string (for the Gmail API raw message field). */
export function base64UrlFromUtf8(str) {
  return base64FromUtf8(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}