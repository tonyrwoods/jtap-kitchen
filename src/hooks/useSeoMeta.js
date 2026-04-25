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
        setMeta("robots", "index, follow");

        // Open Graph
        setMetaProperty("og:type", "website");
        setMetaProperty("og:url", window.location.href);
        setMetaProperty("og:title", settings.og_title || settings.meta_title);
        setMetaProperty("og:description", settings.og_description || settings.meta_description);
        if (settings.og_image) {
          setMetaProperty("og:image", settings.og_image);
        }

        // Twitter Card
        setMeta("twitter:card", "summary_large_image");
        setMeta("twitter:title", settings.og_title || settings.meta_title);
        setMeta("twitter:description", settings.og_description || settings.meta_description);
        if (settings.og_image) {
          setMeta("twitter:image", settings.og_image);
        }

        // Canonical
        setCanonical(window.location.href);
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

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}