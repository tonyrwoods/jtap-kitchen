import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Loader2, MailX } from "lucide-react";

export default function Unsubscribe() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const [status, setStatus] = useState(email ? "loading" : "missing");

  useEffect(() => {
    document.title = "Unsubscribe — JTAP Kitchen";
    if (!email) { setStatus("missing"); return; }
    base44.functions.invoke("unsubscribeEmail", { email })
      .then((res) => {
        if (res.data?.success) setStatus("done");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [email]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          {status === "loading" ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> :
            status === "done" ? <CheckCircle className="w-8 h-8 text-emerald-600" /> :
              <MailX className="w-8 h-8 text-primary" />}
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">
          {status === "loading" ? "Processing…" :
            status === "done" ? "You're Unsubscribed" :
              status === "error" ? "Something Went Wrong" : "Unsubscribe"}
        </h1>
        {status === "done" && (
          <p className="font-body text-sm text-muted-foreground">
            {email ? `We've removed ${email} from our mailing list. You won't receive marketing emails from JTAP Kitchen anymore.` : "You've been removed from our mailing list."}
          </p>
        )}
        {status === "error" && (
          <p className="font-body text-sm text-muted-foreground">
            We couldn't process your request right now. Please try again or email info@jtapkitchen.com.
          </p>
        )}
        {status === "missing" && (
          <p className="font-body text-sm text-muted-foreground">
            No email was provided. Use the unsubscribe link in one of our emails to be removed from the list.
          </p>
        )}
        <a href="/" className="inline-block mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90">
          Back to Home
        </a>
      </div>
    </div>
  );
}