import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

// Mobile-only sticky bottom bar that surfaces the Reserve CTA on every scroll.
// Hidden on desktop (md:hidden) where the navbar already carries the action.
export default function StickyReserveBar({ onBook }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : 100, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed bottom-0 inset-x-0 z-40 md:hidden"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => onBook?.()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
        >
          <Calendar className="w-4 h-4" />
          Reserve a Table
        </button>
      </div>
    </motion.div>
  );
}