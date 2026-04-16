import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Flame, Wheat, Nut } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["All", "Starters", "Mains", "Desserts", "Drinks"];

const DIETARY_ICONS = {
  Vegetarian: { icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
  Vegan: { icon: Leaf, color: "text-emerald-700", bg: "bg-emerald-50" },
  "Gluten-Free": { icon: Wheat, color: "text-amber-600", bg: "bg-amber-50" },
  "Contains Nuts": { icon: Nut, color: "text-yellow-700", bg: "bg-yellow-50" },
  Spicy: { icon: Flame, color: "text-red-600", bg: "bg-red-50" },
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
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden group flex flex-col">
      {item.image_url && (
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {item.is_featured && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full font-body uppercase tracking-wide">
              Chef's Pick
            </span>
          )}
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">{item.name}</h3>
          <span className="font-heading text-lg font-bold text-primary shrink-0">${Number(item.price).toFixed(2)}</span>
        </div>
        {item.description && (
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3 flex-1">{item.description}</p>
        )}
        {item.dietary_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {item.dietary_tags.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    base44.entities.MenuItem.list("-created_date", 100).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const filtered = (activeCategory === "All"
    ? items
    : items.filter((item) => item.category === activeCategory)
  ).filter(Boolean);

  return (
    <section id="menu" className="py-24 md:py-32 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Culinary Excellence
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-5">
            Our Menu
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Thoughtfully crafted dishes using the finest seasonal ingredients, designed to surprise and delight.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-all duration-300 border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground text-lg">No items in this category yet.</p>
            <p className="font-body text-sm text-muted-foreground mt-2">Add menu items from the dashboard to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}