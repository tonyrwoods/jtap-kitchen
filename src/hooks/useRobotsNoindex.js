import { useEffect } from "react";

/**
 * Sets robots meta tag to "noindex, nofollow" for internal admin pages
 */
export default function useRobotsNoindex() {
  useEffect(() => {
    let el = document.querySelector('meta[name="robots"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "robots");
      document.head.appendChild(el);
    }
    el.setAttribute("content", "noindex, nofollow");

    return () => {
      if (el) el.setAttribute("content", "index, follow");
    };
  }, []);
}