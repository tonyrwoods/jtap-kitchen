import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

export default function WaitlistConfirmationModal({ event, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl max-w-sm w-full p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="font-heading text-2xl font-semibold mb-2">You're on the Waitlist!</h3>
        <p className="font-body text-sm text-muted-foreground mb-6">
          We'll notify you as soon as a spot opens for <span className="font-semibold text-foreground">{event.title}</span> on {new Date(event.date).toLocaleDateString()}.
        </p>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-all"
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}