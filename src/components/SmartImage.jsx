import { useState } from "react";
import { ImageIcon } from "lucide-react";

/**
 * SmartImage — a reusable image component with graceful broken-image fallback.
 * Defaults to lazy loading and async decoding for performance.
 * If the source fails to load, shows a branded placeholder instead of a broken image icon.
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  fallbackClassName = "",
  loading = "lazy",
  decoding = "async",
  fetchpriority,
  onClick,
  ...rest
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${fallbackClassName} ${className}`}
        onClick={onClick}
        role={alt ? "img" : undefined}
        aria-label={alt || "Image unavailable"}
      >
        <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${imgClassName || className}`}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchpriority}
      onError={() => setHasError(true)}
      onClick={onClick}
      {...rest}
    />
  );
}