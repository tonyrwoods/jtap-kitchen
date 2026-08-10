import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ThankYou() {
  useEffect(() => {
    document.title = "Thank You — JTAP Kitchen";
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
      <div className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Thank You!</h1>
        <p className="font-body text-muted-foreground text-sm mb-6">
          Your payment was successful. Your gift card has been activated and a confirmation email is on its way.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/gift-cards"
            className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-all"
          >
            Buy Another Gift Card
          </Link>
          <Link
            to="/"
            className="w-full py-3 border border-border rounded-full font-body text-sm font-medium hover:bg-secondary transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}