import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import MenuItemCard from "@/components/menu/MenuItemCard";

const CATEGORIES = ["All", "Appetizers", "Salads & Sandwiches", "Entrees", "Sides", "Desserts"];



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

  const allFiltered = items
    .filter(item => item && item.id && item.name)
    .filter(activeCategory === "All" ? () => true : (item) => item.category === activeCategory);

  // On homepage, show featured items first, cap at 8
  const sortedByFeatured = [...allFiltered].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  const filtered = sortedByFeatured.slice(0, 8);

  return (
    <section id="menu" className="py-24 md:py-32 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            What We're Serving
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-5">
            Our Menu
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Real food made with care. Seasonal ingredients, bold flavors, and dishes worth coming back for.
          </p>
        </div>

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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
              {filtered.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
            {allFiltered.length > 8 && (
              <div className="text-center mt-12">
                <Link to="/full-menu"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-foreground text-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-foreground hover:text-background transition-all duration-300">
                  View Full Menu
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}