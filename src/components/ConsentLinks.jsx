import { Link } from "react-router-dom";

/**
 * Visible consent links for every customer-facing form that collects contact
 * details (and for the SMS opt-in flows). Carriers require a direct, visible
 * link to the Privacy Policy and Terms & Conditions wherever a customer opts in.
 */
export default function ConsentLinks({ className = "", text = "By submitting this form you agree to our" }) {
  return (
    <p className={`font-body text-[11px] text-muted-foreground/80 text-center leading-relaxed ${className}`}>
      {text}{" "}
      <Link to="/terms-of-service" className="underline underline-offset-2 text-primary hover:opacity-80">Terms &amp; Conditions</Link>{" "}
      and{" "}
      <Link to="/privacy-policy" className="underline underline-offset-2 text-primary hover:opacity-80">Privacy Policy</Link>.
    </p>
  );
}