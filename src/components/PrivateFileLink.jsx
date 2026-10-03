import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

/**
 * Renders a link that opens a privately-stored file by generating a short-lived
 * signed URL on click. Falls back to a direct link when the value is already a
 * public http(s) URL (legacy records uploaded before the private-storage switch).
 */
export default function PrivateFileLink({ uri, className, children }) {
  const [loading, setLoading] = useState(false);
  const isPublicUrl = typeof uri === "string" && /^https?:\/\//.test(uri);

  const handleClick = async (e) => {
    if (isPublicUrl) return; // let the anchor navigate normally
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      window.open(signed_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to resolve private file URL", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <a
      href={isPublicUrl ? uri : "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 inline -mt-0.5 animate-spin" /> : null}
      {children}
    </a>
  );
}