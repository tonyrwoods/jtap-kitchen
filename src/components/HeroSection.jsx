import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/dbe7ca72f_generated_6964c032.png"
          alt="Fine dining dish beautifully plated"
          className="w-full h-full object-cover"
          fetchpriority="high"
          decoding="async" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-body text-sm md:text-base uppercase tracking-[0.3em] text-white/70 mb-6">
          
          Fine Dining Experience
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="inline-flex items-center gap-3 px-8 py-3.5 mb-8 rounded-full border border-amber-400/50 bg-amber-400/10 backdrop-blur-sm"
        >
          <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-body text-sm md:text-base uppercase tracking-[0.25em] font-semibold text-amber-300">
            Opening Soon — Jun 2026
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 1, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] mb-8">
          
          Where Every Bite
          <br />
          <span className="italic font-normal text-amber-300/90">Tells a Story</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="font-body text-base md:text-lg text-white/75 max-w-xl mx-auto mb-12 leading-relaxed">
          
          An intimate culinary journey crafted with seasonal ingredients,
          timeless techniques, and a passion for perfection.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          
          <a
            href="#reserve"
            className="px-10 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25">
            Reserve Your Table
          </a>
          <a
            href="#menu"
            className="px-10 py-4 border-2 border-white/30 text-white font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all duration-300">
            Explore Menu
          </a>
          <a
            href="/event-center"
            className="px-10 py-4 border-2 border-amber-400/50 text-amber-300 font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-amber-400/10 transition-all duration-300">
            🎉 Host an Event
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2">
        
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}>
          
          <ArrowDown className="w-5 h-5 text-white/50" />
        </motion.div>
      </motion.div>
    </section>);

}