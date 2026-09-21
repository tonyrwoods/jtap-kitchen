import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { trackPixel } from "@/lib/metaPixel";
import LiquorMenuContent from "@/components/menu/LiquorMenuContent";

export default function LiquorMenu() {
  useSeoMeta("liquor_menu");
  useEffect(() => {
    document.title = "Liquor Menu — JTAP Kitchen";
  }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.LiquorMenuItem.list("sort_order", 200).then((data) => {
      setItems(data.filter((i) => i && i.id && i.name && i.is_active !== false));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    trackPixel("ViewContent", { content_name: "Liquor Menu", content_category: "Menu" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1600&q=80"
          alt="JTAP Kitchen Liquor Menu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3">
            JTAP Kitchen
          </p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">
            Liquor Menu
          </h1>
          <p className="font-body text-white/70 max-w-lg text-base md:text-lg">
            Handcrafted cocktails, curated wines, and a full selection of premium spirits.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <LiquorMenuContent items={items} />
        )}
      </div>

      <div className="text-center py-8 border-t border-border">
        <p className="font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} JTAP Kitchen · Memphis, TN
        </p>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Please drink responsibly. 21+ with valid ID.
        </p>
      </div>
    </div>
  );
}