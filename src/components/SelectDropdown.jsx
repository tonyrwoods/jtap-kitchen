import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

export default function SelectDropdown({ value, onChange, options, placeholder = "Select...", disabled = false }) {
  const haptic = useHaptic();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 280)),
        width: Math.min(264, rect.width),
      });
    }
  }, [open]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleSelect = (optValue) => {
    haptic.tap();
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => { if (!disabled) { haptic.tap(); setOpen(!open); } }}
        disabled={disabled}
        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground font-body text-sm flex items-center justify-between hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selectedLabel === placeholder ? "text-muted-foreground" : ""}>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* iOS-style Bottom Sheet (Mobile) */}
      {isMobile && (
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto scrollbar-hide"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-muted" />
                </div>
                <div className="space-y-2">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-4 py-3 rounded-lg text-left font-body text-sm font-medium transition-colors ${
                        value === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Popover (Desktop) */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden scrollbar-hide"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  width: `${position.width}px`,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <div className="space-y-1 p-1">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3 py-2 rounded-lg text-left font-body text-sm font-medium transition-colors ${
                        value === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}