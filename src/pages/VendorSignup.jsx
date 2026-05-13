import EventServiceProviderSignup from "../components/EventServiceProviderSignup";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function VendorSignup() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-4">
        <Link to="/event-center" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Event Center
        </Link>
      </div>
      <EventServiceProviderSignup />
    </div>
  );
}