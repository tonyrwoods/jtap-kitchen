import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Star, CheckCircle2, PartyPopper, ArrowLeft } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import StarRating from "@/components/scorecards/StarRating";
import ScorecardSummary from "@/components/scorecards/ScorecardSummary";

export default function PromotionScorecard() {
  const { slug } = useParams();
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    guest_name: "",
    email: "",
    dishes_rating: 0,
    service_rating: 0,
    atmosphere_rating: 0,
    comment: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    document.title = "Rate Your Experience — JTAP Kitchen";
    base44.entities.EventPromotion
      .filter({ share_slug: slug })
      .then((data) => {
        if (data[0]) setPromo(data[0]);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const canSubmit =
    form.guest_name.trim() &&
    form.dishes_rating > 0 &&
    form.service_rating > 0 &&
    form.atmosphere_rating > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please add your name and all three ratings");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitPromotionScorecard", {
        share_slug: slug,
        guest_name: form.guest_name.trim(),
        email: form.email.trim().toLowerCase(),
        dishes_rating: form.dishes_rating,
        service_rating: form.service_rating,
        atmosphere_rating: form.atmosphere_rating,
        comment: form.comment.trim(),
      });
      if (res.data?.success) {
        setSubmitted(true);
        toast.success("Thank you for your feedback!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(res.data?.error || "Failed to submit");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !promo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <PartyPopper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Scorecard Not Found</h1>
          <p className="font-body text-muted-foreground">This scorecard link may be invalid or the event has been removed.</p>
          <a href="/" className="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero */}
      <div className="relative h-44 md:h-56 overflow-hidden">
        {promo.banner_image_url ? (
          <SmartImage src={promo.banner_image_url} alt={promo.title} imgClassName="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-foreground" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wide mb-2">
              <Star className="w-3 h-3" /> Guest Scorecard
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white leading-tight">{promo.title}</h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          to={`/event-announce/${promo.share_slug}`}
          className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to event
        </Link>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8 text-center mb-10"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">Thank You!</h2>
            <p className="font-body text-muted-foreground mb-5">
              Your scorecard has been submitted and is awaiting review. Once approved, your ratings and comments will appear below for other guests to see.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ guest_name: "", email: "", dishes_rating: 0, service_rating: 0, atmosphere_rating: 0, comment: "" });
              }}
              className="px-6 py-2.5 border border-border rounded-full font-body text-sm font-medium hover:bg-muted transition-colors"
            >
              Submit Another
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-10"
          >
            <h2 className="font-heading text-xl font-bold mb-1">Rate Your Experience</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">
              How did we do? Rate each category and share your thoughts about <strong>{promo.title}</strong>.
            </p>

            {/* Ratings */}
            <div className="space-y-5 mb-6">
              {[
                { key: "dishes_rating", label: "Dishes", hint: "The food" },
                { key: "service_rating", label: "Service", hint: "The team" },
                { key: "atmosphere_rating", label: "Atmosphere", hint: "The vibe" },
              ].map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-body text-sm font-semibold">{r.label} <span className="text-muted-foreground font-normal">· {r.hint}</span></p>
                  </div>
                  <StarRating value={form[r.key]} onChange={(v) => set(r.key, v)} />
                </div>
              ))}
            </div>

            {/* Name + email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="font-body text-sm font-semibold mb-1.5 block">Your Name *</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.guest_name}
                  onChange={(e) => set("guest_name", e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-1.5 block">Email <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="email"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="font-body text-sm font-semibold mb-1.5 block">Comments <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                value={form.comment}
                onChange={(e) => set("comment", e.target.value)}
                placeholder="What did you love? Anything we could improve? Favorite dish?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Submitting..." : "Submit Scorecard"}
            </button>
            <p className="font-body text-xs text-muted-foreground text-center mt-3">
              Your scorecard is reviewed by our team before it appears publicly.
            </p>
          </motion.form>
        )}

        {/* Approved scorecards */}
        <ScorecardSummary slug={promo.share_slug} />
      </div>
    </div>
  );
}