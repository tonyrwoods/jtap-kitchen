import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useSeoMeta from "../hooks/useSeoMeta";

export default function GuestFeedback() {
  useSeoMeta("feedback");
  const urlParams = new URLSearchParams(window.location.search);
  const [score, setScore] = useState(null);
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatCouldImprove, setWhatCouldImprove] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const email = urlParams.get("email") || "";
  const name = urlParams.get("name") || "";

  const handleSubmit = async () => {
    if (score === null) {
      toast.error("Please select a score");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitGuestFeedback", {
        guest_name: name || "Guest",
        email: email || "guest@jtapkitchen.com",
        nps_score: score,
        what_went_well: whatWentWell,
        what_could_improve: whatCouldImprove,
        would_recommend: wouldRecommend,
      });
      if (res.data?.status === "success") {
        setSubmitted(true);
      } else {
        toast.error(res.data?.error || "Could not submit feedback");
      }
    } catch {
      toast.error("Could not submit feedback");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-3">Thank You!</h1>
          <p className="font-body text-muted-foreground mb-2">
            Your feedback means the world to us. We read every response and use it to make JTAP Kitchen better.
          </p>
          <a href="/" className="inline-block mt-6 px-8 py-3 border border-border rounded-full font-body text-sm font-medium hover:bg-secondary transition-colors">
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-body text-xs uppercase tracking-widest text-primary font-semibold mb-1">JTAP Kitchen</p>
          <h1 className="font-heading text-3xl font-bold">How Did We Do?</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Your honest feedback takes 2 minutes and helps us serve you better.
          </p>
        </div>

        {/* NPS Score */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <p className="font-body text-sm font-medium text-center mb-4">
            On a scale of 0 to 10, how likely are you to recommend JTAP Kitchen to a friend?
          </p>
          <div className="flex justify-between gap-1 mb-2">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={`flex-1 aspect-square rounded-full text-sm font-bold transition-all ${
                  score === i
                    ? "bg-primary text-primary-foreground scale-110 shadow-md"
                    : i <= 6
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : i <= 8
                    ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>

        {/* Would recommend */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <p className="font-body text-sm font-medium mb-3">Would you visit us again?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setWouldRecommend(true)}
              className={`flex-1 py-3 rounded-xl font-body text-sm font-medium border transition-all ${
                wouldRecommend === true ? "bg-green-50 border-green-500 text-green-700" : "border-border hover:bg-muted"
              }`}
            >
              Yes, definitely!
            </button>
            <button
              onClick={() => setWouldRecommend(false)}
              className={`flex-1 py-3 rounded-xl font-body text-sm font-medium border transition-all ${
                wouldRecommend === false ? "bg-red-50 border-red-500 text-red-700" : "border-border hover:bg-muted"
              }`}
            >
              Not sure
            </button>
          </div>
        </div>

        {/* What went well */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <label className="font-body text-sm font-medium block mb-2">What did you enjoy about your visit?</label>
          <textarea
            value={whatWentWell}
            onChange={e => setWhatWentWell(e.target.value)}
            rows={3}
            placeholder="Tell us about the food, service, atmosphere..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* What could improve */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <label className="font-body text-sm font-medium block mb-2">What could we do better?</label>
          <textarea
            value={whatCouldImprove}
            onChange={e => setWhatCouldImprove(e.target.value)}
            rows={3}
            placeholder="We value your honest suggestions..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || score === null}
          className="w-full py-4 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>

        <p className="text-center font-body text-xs text-muted-foreground mt-4">
          Your feedback is private and goes directly to our team.
        </p>
      </div>
    </div>
  );
}