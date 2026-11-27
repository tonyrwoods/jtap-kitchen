import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { XCircle } from "lucide-react";

// Client-side gate for the staff/POS consoles. Entity rules stay the real
// boundary; this keeps non-staff visitors out of the screens themselves.
export default function StaffGate({ children }) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    base44.auth.me()
      .then((user) => setState(user?.role === "admin" || user?.role === "staff" ? "allowed" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Access Denied</h2>
          <p className="font-body text-muted-foreground mb-6">Staff access is required to view this page.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return children;
}