import { motion } from "framer-motion";
import { ArrowDown, Phone } from "lucide-react";
import SmartImage from "@/components/SmartImage";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <SmartImage
          src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/dbe7ca72f_generated_6964c032.png"
          alt="Beautifully plated dish at JTAP Kitchen"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          imgClassName="w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-body text-sm md:text-base uppercase tracking-[0.3em] text-white/70 mb-6">
          
          High-End Casual Dining
        </motion.p>

        <motion.h1
          initial={{ opacity: 1, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] mb-8">
          
          Memphis&rsquo; Best
          <br />
          <span className="italic font-normal text-amber-300/90">High-End Dining Restaurant</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="font-body text-base md:text-lg text-white/75 max-w-xl mx-auto mb-6 leading-relaxed">
          
          Bold American comfort food. Real hospitality. No pretense.
          Memphis, TN's freshest dining experience — come hungry, leave obsessed.
        </motion.p>

        <motion.a
          href="tel:+19012138085"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="inline-flex items-center gap-2 mb-8 font-body text-sm text-white/60 hover:text-primary transition-colors"
        >
          <Phone className="w-4 h-4" />
          (901) 213-8085
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          
          <a
            href="#reserve"
            className="px-10 py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25">
            Reserve Your Table — Book Direct &amp; Save
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