/**
 * useHaptic Hook
 * Provides haptic feedback (vibration) on mobile devices
 * Falls back gracefully on unsupported browsers
 */
export const useHaptic = () => {
  const trigger = (pattern = 10) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  return {
    tap: () => trigger(10),           // Light tap: 10ms
    success: () => trigger([10, 20, 10]), // Tick-tick: success feedback
    error: () => trigger([30, 50, 30]),   // Long vibration: error feedback
    warning: () => trigger([20, 10, 20]), // Double tick: warning
  };
};