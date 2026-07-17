import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChefHighlights() {
  const [dishes, setDishes] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    base44.entities.FeaturedDish.filter({ is_active: true }).then(data => {
      setDishes(data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    });
  }, []);

  if (dishes.length === 0) return null;

  const dish = dishes[index];
  const prev = () => setIndex(i => (i - 1 + dishes.length) % dishes.length);
  const next = () => setIndex(i => (i + 1) % dishes.length);

  return (
    <section className="py-20 px-6 bg-foreground text-background overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-2">On the Menu Now</p>
          <h2 className="font-heading text-4xl font-bold">Chef's Favorites</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img
              key={dish.id}
              src={dish.image_url}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            {dish.season && (
              <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-body font-semibold px-3 py-1 rounded-full">
                {dish.season}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center">
            <h3 className="font-heading text-3xl font-bold mb-4">{dish.name}</h3>
            {dish.description && (
              <p className="font-body text-background/70 leading-relaxed mb-5">{dish.description}</p>
            )}
            {dish.chef_note && (
              <blockquote className="border-l-2 border-primary pl-4 mb-6 italic font-body text-background/60 text-sm">
                "{dish.chef_note}"
              </blockquote>
            )}
            {dish.price && (
              <p className="font-heading text-2xl font-bold text-primary mb-6">${Number(dish.price).toFixed(2)}</p>
            )}

            {/* Nav */}
            {dishes.length > 1 && (
              <div className="flex items-center gap-4">
                <button onClick={prev}
                  className="w-10 h-10 rounded-full border border-background/30 flex items-center justify-center hover:bg-background/10 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {dishes.map((_, i) => (
                    <button key={i} onClick={() => setIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === index ? "bg-primary w-5" : "bg-background/30"}`} />
                  ))}
                </div>
                <button onClick={next}
                  className="w-10 h-10 rounded-full border border-background/30 flex items-center justify-center hover:bg-background/10 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}