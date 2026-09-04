import { Star } from "lucide-react";

// Interactive (onChange supplied) or read-only star rating.
export default function StarRating({ value = 0, onChange, size = "w-6 h-6", className = "" }) {
  const readOnly = !onChange;
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(i)}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform p-0.5`}
        >
          <Star
            className={`${size} ${
              i <= value
                ? "text-primary fill-primary"
                : "text-muted-foreground/35 fill-transparent"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}