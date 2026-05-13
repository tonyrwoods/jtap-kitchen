import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, Flame, Wheat, Nut, UtensilsCrossed, ChefHat, Salad, Beef, CupSoda, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { key: "All", label: "Full Menu", icon: UtensilsCrossed },
  { key: "Appetizers", label: "Appetizers", icon: ChefHat },
  { key: "Salads & Sandwiches", label: "Salads & Sandwiches", icon: Salad },
  { key: "Entrees", label: "Entrees", icon: Beef },
  { key: "Sides", label: "Sides", icon: CupSoda },
  { key: "Desserts", label: "Desserts", icon: Cookie },
];

const CATEGORY_IMAGES = {
  Appetizers: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=1200&q=80",
  "Salads & Sandwiches": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
  Entrees: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80",
  Sides: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&q=80",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80",
};

const DIETARY_ICONS = {
  Vegetarian: { icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
  Vegan: { icon: Leaf, color: "text-emerald-700", bg: "bg-emerald-50" },
  "Gluten-Free": { icon: Wheat, color: "text-amber-600", bg: "bg-amber-50" },
  "Contains Nuts": { icon: Nut, color: "text-yellow-700", bg: "bg-yellow-50" },
  Spicy: { icon: Flame, color: "text-red-600", bg: "bg-red-50" },
};

const SECTION_ORDER = ["Appetizers", "Salads & Sandwiches", "Entrees", "Sides", "Desserts"];

const FALLBACK_IMAGES = {
  Appetizers: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&q=80",
  "Salads & Sandwiches": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  Entrees: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
  Sides: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80",
};

function DietaryBadge({ tag }) {
  const config = DIETARY_ICONS[tag];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {tag}
    </span>
  );
}

function MenuCard({ item }) {
  const imgSrc = item.image_url || FALLBACK_IMAGES[item.category];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group flex flex-col hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={imgSrc}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {item.is_featured && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full font-body uppercase tracking-wide">
            Chef's Pick
          </span>
        )}
        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-body px-2.5 py-1 rounded-full">
          {item.category}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">{item.name}</h3>
          {item.price ? (
            <span className="font-heading text-lg font-bold text-primary shrink-0">
              ${Number(item.price).toFixed(2)}
            </span>
          ) : null}
        </div>
        {item.description && (
          <p className="font-body text-sm text-muted-foreground leading-relaxed flex-1">{item.description}</p>
        )}
        {Array.isArray(item.dietary_tags) && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {item.dietary_tags.map((tag) => <DietaryBadge key={tag} tag={tag} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CategorySection({ category, items }) {
  if (items.length === 0) return null;
  const heroImg = CATEGORY_IMAGES[category];
  return (
    <div className="mb-20">
      {/* Section header with banner */}
      <div className="relative rounded-2xl overflow-hidden h-36 mb-8">
        {heroImg && (
          <img src={heroImg} alt={category} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 flex items-center px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">{category}</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => <MenuCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    base44.entities.MenuItem.list("created_date", 200).then((data) => {
      setItems(data.filter(i => i && i.id && i.name));
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === "All"
    ? items
    : items.filter(item => item.category === activeCategory);

  const groupedByCategory = SECTION_ORDER.reduce((acc, cat) => {
    acc[cat] = filtered.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
          alt="JTAP Kitchen Menu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3">JTAP Kitchen</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">Our Menu</h1>
          <p className="font-body text-white/70 max-w-lg text-base md:text-lg">
            Crafted with passion, served with pride. Explore our full menu of Southern-inspired dishes.
          </p>
        </div>
      </div>

      {/* Sticky Category Filter */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+80px)] z-30 bg-background/98 backdrop-blur-md border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = cat.key === "All" ? items.length : items.filter(i => i.category === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 border ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-card text-foreground border-border hover:border-primary hover:text-primary hover:bg-primary/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{cat.label}</span>
                {!loading && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeCategory === cat.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-muted-foreground text-lg">No items in this category yet.</p>
          </div>
        ) : activeCategory === "All" ? (
          // Grouped by section
          SECTION_ORDER.map(cat => (
            <CategorySection key={cat} category={cat} items={groupedByCategory[cat]} />
          ))
        ) : (
          // Single category flat grid
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map(item => <MenuCard key={item.id} item={item} />)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}