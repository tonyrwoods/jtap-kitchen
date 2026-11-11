import { cn } from "@/lib/utils";

export const TAGLINE = "Where Every Bite Tells a Story";

/**
 * Shared brand tagline.
 * Pass className to control size/color for each surface.
 */
export default function Tagline({ className, ...props }) {
  return (
    <p className={cn("font-heading italic tracking-wide", className)} {...props}>
      {TAGLINE}
    </p>
  );
}