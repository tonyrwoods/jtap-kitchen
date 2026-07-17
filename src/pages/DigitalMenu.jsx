import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import useSeoMeta from "../hooks/useSeoMeta";

const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks"];

const DIETARY_COLORS = {
  "Vegetarian": "bg-green-100 text-green-800",
  "Vegan": "bg-emerald-100 text-emerald-800",
  "Gluten-Free": "bg-yellow-100 text-yellow-800",
  "Contains Nuts": "bg-orange-100 text-orange-800",
  "Spicy": "bg-red-100 text-red-800",
};

function MenuCard({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
    >
      {item.image_url && (
        <div className="h-44 overflow-hidden">
          <img src={item.image_url} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading text-base font-semibold leading-snug">{item.name}</h3>
          <span className="font-heading text-base font-bold text-primary shrink-0">${Number(item.price).toFixed(2)}</span>
        </div>
        {item.is_featured && (
          <span className="text-xs text-primary font-body font-medium mb-1">⭐ Chef's Pick</span>
        )}
        {item.description && (
          <p className="font-body text-sm text-muted-foreground leading-relaxed flex-1">{item.description}</p>
        )}
        {item.dietary_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.dietary_tags.map(tag => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-body font-medium ${DIETARY_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const DIETARY_FILTERS = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Contains Nuts", "Spicy"];

export default function DigitalMenu() {
  useSeoMeta("menu");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDietaryTags, setActiveDietaryTags] = useState([]);
  const urlParams = new URLSearchParams(window.location.search);
  const tableNum = urlParams.get("table");

  useEffect(() => {
    base44.entities.MenuItem.list("category", 200).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const toggleTag = (tag) => {
    setActiveDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const categories = ["All", ...CATEGORIES.filter(c => items.some(i => i.category === c))];
  const filtered = items
    .filter(i => activeCategory === "All" || i.category === activeCategory)
    .filter(i => activeDietaryTags.length === 0 || activeDietaryTags.every(tag => i.dietary_tags?.includes(tag)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-3">
          <div className="text-center mb-4">
            <p className="font-body text-xs uppercase tracking-widest text-primary font-semibold mb-1">
              {tableNum ? `Table ${tableNum}` : "JTAP Kitchen"}
            </p>
            <h1 className="font-heading text-3xl font-bold">Our Menu</h1>
          </div>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Dietary tag filters */}
          <div className="flex gap-2 overflow-x-auto pt-2 pb-1 scrollbar-hide">
            {DIETARY_FILTERS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`shrink-0 px-3 py-1 rounded-full font-body text-xs font-medium border transition-all ${
                  activeDietaryTags.includes(tag)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center font-body text-muted-foreground py-20">No items match your current filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(item => <MenuCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border">
        <p className="font-body text-xs text-muted-foreground">© {new Date().getFullYear()} JTAP Kitchen · Memphis, TN</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Please inform your server of any allergies.</p>
      </div>
    </div>
  );
}