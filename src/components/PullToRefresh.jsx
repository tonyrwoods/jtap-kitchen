import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw } from "lucide-react";

export default function PullToRefresh({ children, onRefresh }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
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

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-y-auto scrollbar-hide"
    >
      {/* Pull-to-Refresh Indicator */}
      <AnimatePresence>
        {(pulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none"
            style={{
              height: `${Math.min(pullDistance, 80)}px`,
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : pullDistance * 3 }}
              transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0 }}
              className="flex items-center justify-center"
            >
              <RotateCw
                className={`w-5 h-5 ${
                  pullDistance > 80 ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull-down transform */}
      <motion.div
        animate={{
          marginTop: pulling || isRefreshing ? Math.min(pullDistance, 80) : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}