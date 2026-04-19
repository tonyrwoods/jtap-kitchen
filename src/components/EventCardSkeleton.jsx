import { motion } from "framer-motion";

export default function EventCardSkeleton({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border border-border rounded-3xl overflow-hidden"
    >
      <div className="h-52 bg-muted animate-pulse" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-muted rounded-full w-2/3 animate-pulse" />
        <div className="h-4 bg-muted rounded-full w-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full w-1/2 animate-pulse" />
          <div className="h-3 bg-muted rounded-full w-1/3 animate-pulse" />
        </div>
        <div className="h-10 bg-muted rounded-full animate-pulse" />
      </div>
    </motion.div>
  );
}