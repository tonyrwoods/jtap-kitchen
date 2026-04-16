import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Fetches SEO settings for a given page_key and updates document head tags.
 * @param {string} pageKey - The unique key for this page (e.g. "home", "menu")
 */
export default function useSeoMeta(pageKey) {
  useEffect(() => {
    base44.entities.SeoSettings.filter({ page_key: pageKey }, "-created_date", 1)
      .then(([settings]) => {
        if (!settings) return;

        if (settings.meta_title) {
          document.title = settings.meta_title;
        }

        setMeta("description", settings.meta_description);
        setMeta("keywords", settings.meta_keywords);

        // Open Graph
        setMetaProperty("og:title", settings.og_title || settings.meta_title);
        setMetaProperty("og:description", settings.og_description || settings.meta_description);
      })
      .catch(() => {});
  }, [pageKey]);
}

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaProperty(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}