import { motion } from "framer-motion";
import { Star } from "lucide-react";

const DISHES = [
  {
    name: "Herb-Crusted Lamb",
    description: "Tender lamb chops with rosemary jus, roasted garlic, and seasonal vegetables",
    price: "$48",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/89cfdcc60_generated_2e76afac.png",
    tag: "Chef's Pick",
  },
  {
    name: "Truffle Tagliatelle",
    description: "House-made pasta with black truffle shavings, aged parmesan, and brown butter",
    price: "$38",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/3c48ff2c8_generated_47c2b45d.png",
    tag: "Signature",
  },
  {
    name: "Seared Atlantic Salmon",
    description: "Wild-caught salmon with lemon beurre blanc, asparagus, and dill potatoes",
    price: "$42",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/0a40c3196_generated_57d29302.png",
    tag: "Popular",
  },
  {
    name: "Classic Tiramisu",
    description: "Espresso-soaked ladyfingers layered with mascarpone cream and cocoa",
    price: "$18",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/96a8a2659_generated_a05cd259.png",
    tag: "Must Try",
  },
];

function DishCard({ dish, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl mb-5 aspect-square">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="absolute top-4 left-4 px-3 py-1 bg-primary/90 text-primary-foreground font-body text-xs font-semibold uppercase tracking-wider rounded-full">
          {dish.tag}
        </span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground mb-1.5">
            {dish.name}
          </h3>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            {dish.description}
          </p>
        </div>
        <span className="font-heading text-xl font-semibold text-primary shrink-0">
          {dish.price}
        </span>
      </div>
    </motion.div>
  );
}

export default function MenuHighlights() {
  return (
    <section id="menu" className="py-24 md:py-32 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Curated Selection
            </span>
            <Star className="w-4 h-4 text-primary fill-primary" />
          </div>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5">
            Our Signature Dishes
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Each dish is a masterpiece, crafted with the finest seasonal ingredients
            and decades of culinary expertise.
          </p>
        </motion.div>

        {/* Dish Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {DISHES.map((dish, i) => (
            <DishCard key={dish.name} dish={dish} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <a
            href="#reserve"
            className="inline-flex items-center px-8 py-3.5 border-2 border-primary text-primary font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View Full Menu
          </a>
        </motion.div>
      </div>
    </section>
  );
}