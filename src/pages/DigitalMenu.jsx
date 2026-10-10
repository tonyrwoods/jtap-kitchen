import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { UtensilsCrossed, Wine, Printer, ShoppingBag, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import MenuCartModal from "@/components/menu/MenuCartModal";
import { QRCodeCanvas } from "qrcode.react";
import useSeoMeta from "../hooks/useSeoMeta";
import { trackPixel } from "@/lib/metaPixel";
import LiquorMenuContent from "@/components/menu/LiquorMenuContent";
import TapRoomSocietyQR from "@/components/TapRoomSocietyQR";

const CATEGORIES = ["Brunch", "Brunch Sides", "Appetizers", "Salads & Sandwiches", "Entrees", "Lunch", "Lunch Sides", "Sides", "Desserts", "Drinks"];

const FALLBACK_IMAGES = {
  Brunch: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&q=80",
  "Brunch Sides": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
  Appetizers: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&q=80",
  "Salads & Sandwiches": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  Entrees: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
  Lunch: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  "Lunch Sides": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  Sides: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80",
  Drinks: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80",
};

const DIETARY_COLORS = {
  "Vegetarian": "bg-green-100 text-green-800",
  "Vegan": "bg-emerald-100 text-emerald-800",
  "Gluten-Free": "bg-yellow-100 text-yellow-800",
  "Contains Nuts": "bg-orange-100 text-orange-800",
  "Spicy": "bg-red-100 text-red-800",
};

function MenuCard({ item, qty, onAdd, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="h-44 overflow-hidden bg-muted relative">
        <img
          src={item.image_url || FALLBACK_IMAGES[item.category]}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        {item.is_featured && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full font-body">
            ⭐ Chef's Pick
          </span>
        )}
      </div>
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
        <div className="mt-3 pt-3 border-t border-border">
          {qty > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={onRemove} className="w-7 h-7 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center" aria-label="Decrease quantity">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-body text-sm font-semibold w-6 text-center">{qty}</span>
                <button onClick={onAdd} className="w-7 h-7 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center" aria-label="Increase quantity">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="font-heading text-sm font-semibold text-primary">${(item.price * qty).toFixed(2)}</span>
            </div>
          ) : (
            <button onClick={onAdd} className="w-full py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add to Order
            </button>
          )}
        </div>
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
  const [menuSort, setMenuSort] = useState("name");
  const [view, setView] = useState("food");
  const [liquorSection, setLiquorSection] = useState("Signature Cocktails");
  const [liquorItems, setLiquorItems] = useState([]);
  const [liquorLoading, setLiquorLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [cart, setCart] = useState({});
  const [itemNotes, setItemNotes] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  const qrRef = useRef(null);
  const handlePrintMenu = async () => {
    setPrinting(true);
    try {
      let liquor = liquorItems;
      if (liquor.length === 0) {
        const data = await base44.entities.LiquorMenuItem.list("sort_order", 200);
        liquor = data.filter(i => i && i.id && i.name && i.is_active !== false);
        setLiquorItems(liquor);
      }
      const qrCanvas = qrRef.current ? qrRef.current.querySelector("canvas") : null;
      const qrDataUrl = qrCanvas ? qrCanvas.toDataURL("image/png") : null;
      const { generateMenuPdf } = await import("@/lib/menuPdf");
      await generateMenuPdf(items, liquor, qrDataUrl);
    } finally {
      setPrinting(false);
    }
  };
  const urlParams = new URLSearchParams(window.location.search);
  const tableNum = urlParams.get("table");

  useEffect(() => {
    base44.entities.MenuItem.list("category", 200).then(data => {
      const sorted = [...data].sort((a, b) => {
        const ca = CATEGORIES.indexOf(a.category);
        const cb = CATEGORIES.indexOf(b.category);
        if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      });
      setItems(sorted);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (view !== "liquor" || liquorItems.length > 0) return;
    setLiquorLoading(true);
    base44.entities.LiquorMenuItem.list("sort_order", 200).then(data => {
      setLiquorItems(data.filter(i => i && i.id && i.name && i.is_active !== false));
      setLiquorLoading(false);
    });
  }, [view, liquorItems.length]);

  useEffect(() => {
    trackPixel("ViewContent", { content_name: view === "liquor" ? "Liquor Menu" : "Digital Menu", content_category: "Menu" });
  }, [view]);

  const toggleTag = (tag) => {
    setActiveDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addToCart = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(c => { const n = (c[id] || 0) - 1; if (n <= 0) { const nc = { ...c }; delete nc[id]; return nc; } return { ...c, [id]: n }; });
  const updateQty = (id, qty) => setCart(c => { if (qty <= 0) { const nc = { ...c }; delete nc[id]; return nc; } return { ...c, [id]: qty }; });
  const updateNotes = (id, note) => setItemNotes(n => ({ ...n, [id]: note }));
  const clearCart = () => { setCart({}); setItemNotes({}); };

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = items.filter(i => cart[i.id] > 0).reduce((s, i) => s + i.price * cart[i.id], 0);

  const hasFeatured = items.some(i => i.is_featured);
  const categories = ["All", ...(hasFeatured ? ["Chef's Favorites"] : []), ...CATEGORIES.filter(c => items.some(i => i.category === c))];
  const filtered = items
    .filter(i => activeCategory === "All" || (activeCategory === "Chef's Favorites" ? i.is_featured : i.category === activeCategory))
    .filter(i => activeDietaryTags.length === 0 || activeDietaryTags.every(tag => i.dietary_tags?.includes(tag)))
    .sort((a, b) => {
      if (menuSort === "price") return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (menuSort === "category") {
        const c = String(a.category || "").localeCompare(String(b.category || ""));
        return c !== 0 ? c : String(a.name || "").localeCompare(String(b.name || ""));
      }
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

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
          {/* Food / Liquor toggle + Print */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
              <button
                onClick={() => setView("food")}
                className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full font-body text-sm font-medium transition-all ${
                  view === "food" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                Food
              </button>
              <button
                onClick={() => setView("liquor")}
                className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full font-body text-sm font-medium transition-all ${
                  view === "liquor" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wine className="w-4 h-4" />
                Liquor
              </button>
            </div>
            <button
              onClick={handlePrintMenu}
              disabled={printing || loading}
              aria-label="Print menu"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-foreground font-body text-sm font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {printing ? (
                <span className="w-4 h-4 border-2 border-muted-foreground/40 border-t-foreground rounded-full animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Print Menu</span>
            </button>
          </div>
          {view === "food" && (
            <>
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
              {/* Sort by */}
              <div className="flex items-center gap-2 pt-2 pb-1">
                <span className="font-body text-xs text-muted-foreground shrink-0">Sort by</span>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { value: "name", label: "Name (A–Z)" },
                    { value: "category", label: "Category (A–Z)" },
                    { value: "price", label: "Price (Low–High)" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMenuSort(opt.value)}
                      className={`shrink-0 px-3 py-1 rounded-full font-body text-xs font-medium border transition-all ${
                        menuSort === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {view === "liquor" && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: "Signature Cocktails", label: "Cocktails" },
                { key: "Wine List", label: "Wine" },
                { key: "Spirits & Liquors", label: "Spirits" },
              ].map(sec => (
                <button
                  key={sec.key}
                  onClick={() => setLiquorSection(sec.key)}
                  className={`shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all ${
                    liquorSection === sec.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {view === "liquor" ? (
          liquorLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : liquorItems.length === 0 ? (
            <p className="text-center font-body text-muted-foreground py-20">Liquor menu is coming soon.</p>
          ) : (
            <LiquorMenuContent items={liquorItems} activeSection={liquorSection} />
          )
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center font-body text-muted-foreground py-20">No items match your current filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(item => <MenuCard key={item.id} item={item} qty={cart[item.id] || 0} onAdd={() => addToCart(item.id)} onRemove={() => removeFromCart(item.id)} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border">
        <p className="font-body text-xs text-muted-foreground">© {new Date().getFullYear()} JTAP Kitchen · Memphis, TN</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Please inform your server of any allergies.</p>
      </div>

      <TapRoomSocietyQR />

      {/* Hidden QR canvas used to embed a Tap Room Society code in the print-menu PDF */}
      <div ref={qrRef} className="w-0 h-0 overflow-hidden" aria-hidden="true">
        <QRCodeCanvas value="https://www.jtapkitchen.com/tap-room-society" size={200} level="M" />
      </div>

      {/* Floating order bar */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-xl hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="font-body text-sm font-semibold">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
          <span className="font-heading text-sm font-bold">${cartTotal.toFixed(2)}</span>
          <span className="font-body text-sm font-medium">View Order →</span>
        </button>
      )}

      {/* Cart modal */}
      {cartOpen && (
        <MenuCartModal
          items={items}
          quantities={cart}
          notes={itemNotes}
          tableNumber={tableNum}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onUpdateNotes={updateNotes}
          onClear={clearCart}
        />
      )}
    </div>
  );
}