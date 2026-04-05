import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const GALLERY = [
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/b3d20a817_generated_image.png",
    label: "The Dining Room",
    category: "Interior",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/8b207bc53_generated_image.png",
    label: "Our Open Kitchen",
    category: "Kitchen",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/92d549431_generated_image.png",
    label: "The Art of Plating",
    category: "Craft",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/574683d15_generated_image.png",
    label: "The Bar",
    category: "Interior",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/8dab81640_generated_image.png",
    label: "Private Dining",
    category: "Interior",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/0b4858b0e_generated_image.png",
    label: "Handmade Pasta",
    category: "Craft",
  },
];

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const img = images[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      {/* Image */}
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={img.url}
          alt={img.label}
          className="w-full max-h-[80vh] object-contain rounded-2xl"
        />
        <div className="text-center mt-4">
          <span className="font-body text-xs uppercase tracking-[0.2em] text-white/40">{img.category}</span>
          <p className="font-heading text-xl text-white mt-1">{img.label}</p>
        </div>
      </motion.div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? "bg-primary w-6" : "bg-white/30"}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const open = (i) => setLightboxIndex(i);
  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i - 1 + GALLERY.length) % GALLERY.length), []);
  const next = useCallback(() => setLightboxIndex((i) => (i + 1) % GALLERY.length), []);

  return (
    <>
      <section id="gallery" className="py-24 md:py-32 bg-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Our World
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-background mt-4 mb-4">
              A Glimpse Inside
            </h2>
            <p className="font-body text-background/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              From the warmth of our dining room to the precision of our kitchen — every
              corner of JTAP Kitchen tells a story.
            </p>
          </motion.div>

          {/* Masonry-style Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {GALLERY.map((item, i) => (
              <motion.div
                key={item.url}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => open(i)}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                  i === 0 ? "md:row-span-2 col-span-2 md:col-span-1" : ""
                }`}
              >
                <div className={`${i === 0 ? "aspect-[4/3] md:aspect-auto md:h-full" : "aspect-[4/3]"} min-h-[160px]`}>
                  <img
                    src={item.url}
                    alt={item.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-5">
                  <span className="font-body text-xs uppercase tracking-widest text-primary">{item.category}</span>
                  <p className="font-heading text-lg text-white mt-1">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={GALLERY}
            index={lightboxIndex}
            onClose={close}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </>
  );
}