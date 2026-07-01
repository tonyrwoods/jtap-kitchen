import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function PullToRefresh({ children, onRefresh, externalRef }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const internalRef = useRef(null);
  const containerRef = externalRef || internalRef;
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);

  const handleTouchStart = (e) => {
    scrollTopRef.current = containerRef.current?.scrollTop || 0;
    if (scrollTopRef.current === 0) {
      startYRef.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);

    if (distance > 0 && scrollTopRef.current === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 120));
    }
  };

  const handleTouchEnd = async () => {
    setPulling(false);

    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / 80, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-y-auto scrollbar-hide"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Pull-to-Refresh Indicator */}
      <AnimatePresence>
        {(pulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
            style={{
              height: "60px",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            {isRefreshing ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                style={{
                  transform: `rotate(${progress * 360}deg)`,
                  scale: 0.8 + progress * 0.2,
                }}
                className="flex items-center justify-center"
              >
                <div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull-down transform */}
      <motion.div
        animate={{
          y: pulling || isRefreshing ? Math.min(pullDistance * 0.5, 40) : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        {children}
      </motion.div>
    </div>
  );
}