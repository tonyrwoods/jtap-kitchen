import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Flame, WheatOff, Star, Fish } from "lucide-react";

const DIETARY = {
  vegan:      { icon: Leaf,     label: "Vegan",       color: "text-green-600 bg-green-50 border-green-200" },
  spicy:      { icon: Flame,    label: "Spicy",       color: "text-red-500 bg-red-50 border-red-200" },
  glutenFree: { icon: WheatOff, label: "Gluten-Free", color: "text-amber-600 bg-amber-50 border-amber-200" },
  chefsPick:  { icon: Star,     label: "Chef's Pick", color: "text-primary bg-primary/10 border-primary/30" },
  sustainable:{ icon: Fish,     label: "Sustainable", color: "text-sky-600 bg-sky-50 border-sky-200" },
};

const CATEGORIES = ["All", "Starters", "Entrées", "Desserts", "Wine & Drinks"];

const MENU = [
  // Starters
  {
    category: "Starters",
    name: "Burrata & Heirloom Tomato",
    description: "Creamy burrata with slow-roasted heirloom tomatoes, basil oil, and aged balsamic reduction",
    price: "$22",
    dietary: ["vegan", "glutenFree"],
    image: "https://images.unsplash.com/photo-1600628421066-f6eddba11c87?w=400&q=80",
  },
  {
    category: "Starters",
    name: "Seared Foie Gras",
    description: "Pan-seared foie gras with brioche, caramelised figs, and Sauternes jelly",
    price: "$36",
    dietary: ["chefsPick"],
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80",
  },
  {
    category: "Starters",
    name: "Lobster Bisque",
    description: "Velvety bisque of Maine lobster with cognac cream, tarragon, and sourdough croutons",
    price: "$28",
    dietary: ["glutenFree"],
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80",
  },
  {
    category: "Starters",
    name: "Wild Mushroom Crostini",
    description: "Toasted sourdough with sautéed wild mushrooms, truffle cream, and fresh thyme",
    price: "$18",
    dietary: ["vegan", "chefsPick"],
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  },

  // Entrées
  {
    category: "Entrées",
    name: "Herb-Crusted Lamb",
    description: "Tender lamb chops with rosemary jus, roasted garlic confit, and seasonal root vegetables",
    price: "$48",
    dietary: ["chefsPick", "glutenFree"],
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/89cfdcc60_generated_image.png",
  },
  {
    category: "Entrées",
    name: "Truffle Tagliatelle",
    description: "House-made pasta with black truffle shavings, aged Parmesan, and brown butter emulsion",
    price: "$38",
    dietary: ["chefsPick"],
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/3c48ff2c8_generated_image.png",
  },
  {
    category: "Entrées",
    name: "Seared Atlantic Salmon",
    description: "Wild-caught salmon with lemon beurre blanc, grilled asparagus, and dill potatoes",
    price: "$42",
    dietary: ["glutenFree", "sustainable"],
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/0a40c3196_generated_image.png",
  },
  {
    category: "Entrées",
    name: "Wagyu Beef Tenderloin",
    description: "A5 Wagyu 8oz with red wine demi-glace, truffle pomme purée, and haricot verts",
    price: "$95",
    dietary: ["chefsPick", "glutenFree"],
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80",
  },
  {
    category: "Entrées",
    name: "Roasted Cauliflower Royale",
    description: "Whole-roasted cauliflower with harissa, pomegranate molasses, and almond cream",
    price: "$32",
    dietary: ["vegan", "glutenFree", "spicy"],
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80",
  },

  // Desserts
  {
    category: "Desserts",
    name: "Classic Tiramisu",
    description: "Espresso-soaked ladyfingers layered with mascarpone cream and dusted with Valrhona cocoa",
    price: "$18",
    dietary: ["chefsPick"],
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/96a8a2659_generated_image.png",
  },
  {
    category: "Desserts",
    name: "Lavender Crème Brûlée",
    description: "Classic Provençal custard infused with lavender, finished with a caramelised sugar crust",
    price: "$16",
    dietary: ["glutenFree"],
    image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80",
  },
  {
    category: "Desserts",
    name: "Chocolate Fondant",
    description: "Warm Valrhona chocolate cake with a molten centre, vanilla bean ice cream, and praline",
    price: "$19",
    dietary: ["chefsPick"],
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
  },

  // Wine & Drinks
  {
    category: "Wine & Drinks",
    name: "Sommelier's Selection (Glass)",
    description: "Marco's weekly rotating glass pour — ask your server for tonight's selection",
    price: "$22",
    dietary: [],
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
  },
  {
    category: "Wine & Drinks",
    name: "Burgundy Pinot Noir",
    description: "Domaine Faiveley, Nuits-Saint-Georges 1er Cru — rich red fruit, silky tannins",
    price: "$185",
    dietary: [],
    image: "https://images.unsplash.com/photo-1569919659476-f0852f6834b7?w=400&q=80",
  },
  {
    category: "Wine & Drinks",
    name: "Signature Cocktail — 'Golden Hour'",
    description: "Aged rum, honey syrup, fresh citrus, and a float of Champagne, garnished with edible gold",
    price: "$24",
    dietary: [],
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
  },
];

function DietaryBadge({ type }) {
  const d = DIETARY[type];
  if (!d) return null;
  const Icon = d.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-body font-medium ${d.color}`}>
      <Icon className="w-3 h-3" />
      {d.label}
    </span>
  );
}

function MenuItem({ item, index }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group flex gap-5 bg-card border border-border rounded-2xl p-4 md:p-5 hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300"
    >
      {/* Image */}
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground leading-tight">
            {item.name}
          </h3>
          <span className="font-heading text-lg md:text-xl font-bold text-primary shrink-0">
            {item.price}
          </span>
        </div>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
          {item.description}
        </p>
        {item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.dietary.map((d) => (
              <DietaryBadge key={d} type={d} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? MENU
    : MENU.filter((item) => item.category === activeCategory);

  return (
    <section id="menu" className="py-24 md:py-32 px-6 lg:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Seasonal Menu
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-5">
            Our Signature Dishes
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Crafted with the finest seasonal ingredients, every dish is a story
            of passion, provenance, and perfection.
          </p>
        </motion.div>

        {/* Dietary Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {Object.entries(DIETARY).map(([key, d]) => (
            <DietaryBadge key={key} type={key} />
          ))}
        </motion.div>

        {/* Tab Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full font-body text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <MenuItem key={item.name} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Reserve CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-14"
        >
          <a
            href="#reserve"
            className="inline-flex items-center px-10 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            Reserve Your Table
          </a>
        </motion.div>
      </div>
    </section>
  );
}