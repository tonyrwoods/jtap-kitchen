import { Star, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackCard({ feedback, onRespond, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-heading text-sm font-semibold text-foreground">{feedback.guest_name}</h4>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            {feedback.visit_date ? new Date(feedback.visit_date).toLocaleDateString() : "No date provided"}
          </p>
        </div>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
            />
          ))}
        </div>
      </div>

      <p className="font-body text-sm text-foreground mb-3 line-clamp-2">{feedback.comment}</p>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        {feedback.status === "Pending" && (
          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>
        )}
        {feedback.status === "Approved" && (
          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">Approved</span>
        )}
        {feedback.manager_response && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Responded</span>
          </div>
        )}
        {!feedback.manager_response && feedback.status === "Approved" && (
          <button
            onClick={() => onRespond(feedback)}
            className="ml-auto px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Respond
          </button>
        )}
      </div>
    </motion.div>
  );
}