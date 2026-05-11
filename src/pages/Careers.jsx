import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Clock, DollarSign, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { toast } from "sonner";

const DEPT_COLORS = {
  "Front of House": "bg-amber-100 text-amber-800",
  "Back of House": "bg-orange-100 text-orange-800",
  "Management": "bg-blue-100 text-blue-800",
  "Bar": "bg-purple-100 text-purple-800",
  "Other": "bg-gray-100 text-gray-800",
};

function ApplicationModal({ job, onClose }) {
  const [form, setForm] = useState({
    applicant_name: "",
    email: "",
    phone: "",
    experience_years: "",
    cover_letter: "",
    resume_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("resume_url", file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicant_name || !form.email) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    await base44.entities.JobApplication.create({
      ...form,
      experience_years: parseFloat(form.experience_years) || 0,
      job_listing_id: job.id,
      job_title: job.title,
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-xl font-bold">Apply — {job.title}</h3>
          <button onClick={onClose} className="p-2 hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-heading text-lg font-bold mb-2">Application Submitted!</h4>
            <p className="font-body text-muted-foreground text-sm mb-6">
              Thank you for your interest in joining JTAP Kitchen. We'll be in touch soon.
            </p>
            <button onClick={onClose} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-semibold mb-1 block">Full Name *</label>
                <input
                  type="text" required
                  value={form.applicant_name}
                  onChange={e => set("applicant_name", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-1 block">Years of Experience</label>
                <input
                  type="number" min="0" step="0.5"
                  value={form.experience_years}
                  onChange={e => set("experience_years", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 2"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-1 block">Why do you want to join JTAP Kitchen?</label>
              <textarea
                rows={4}
                value={form.cover_letter}
                onChange={e => set("cover_letter", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Tell us a bit about yourself and why you'd be a great fit..."
              />
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-2 block">Resume (optional)</label>
              <label className="flex items-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : form.resume_url ? "Resume uploaded ✓" : "Upload PDF or Word doc"}
                </span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={uploading} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function JobCard({ job, onApply }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-body ${DEPT_COLORS[job.department] || DEPT_COLORS["Other"]}`}>
              {job.department}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-body bg-secondary text-secondary-foreground">
              {job.employment_type}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-body bg-green-100 text-green-800">
              💰 Quarterly Bonus
            </span>
          </div>
          <h3 className="font-heading text-xl font-bold text-foreground mb-1">{job.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            {job.pay_range && (
              <span className="flex items-center gap-1 font-body text-sm">
                <DollarSign className="w-3.5 h-3.5" /> {job.pay_range}
              </span>
            )}
            <span className="flex items-center gap-1 font-body text-sm">
              <Clock className="w-3.5 h-3.5" /> {job.employment_type}
            </span>
          </div>
        </div>
        <button
          onClick={() => onApply(job)}
          className="shrink-0 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Apply Now
        </button>
      </div>

      {(job.description || job.requirements) && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 font-body text-sm text-primary hover:underline"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Hide details" : "View details"}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  {job.description && (
                    <div>
                      <h4 className="font-body text-sm font-semibold mb-1">About the Role</h4>
                      <p className="font-body text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
                    </div>
                  )}
                  {job.requirements && (
                    <div>
                      <h4 className="font-body text-sm font-semibold mb-1">Requirements</h4>
                      <p className="font-body text-sm text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function Careers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState(null);
  const [filter, setFilter] = useState("All");

  const DEPARTMENTS = ["All", "Front of House", "Back of House", "Management", "Bar", "Other"];

  useEffect(() => {
    base44.entities.JobListing.filter({ is_active: true }, "-created_date", 50)
      .then(data => { setJobs(data); setLoading(false); });
  }, []);

  const filtered = filter === "All" ? jobs : jobs.filter(j => j.department === filter);

  // Group by department
  const grouped = filtered.reduce((acc, job) => {
    const dept = job.department || "Other";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(job);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-foreground text-background py-20 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body text-xs uppercase tracking-[0.3em] text-white/50 mb-4"
        >
          Join Our Team
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-heading text-4xl md:text-5xl font-bold mb-4"
        >
          Careers at JTAP Kitchen
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-body text-base text-white/60 max-w-xl mx-auto"
        >
          Be part of a team passionate about exceptional food, genuine hospitality, and creating unforgettable moments.
        </motion.p>
      </div>

      {/* Listings */}
      <div className="max-w-3xl mx-auto px-6 py-14">
        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => setFilter(dept)}
              className={`px-4 py-1.5 rounded-full font-body text-sm font-medium transition-colors ${
                filter === dept
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold mb-2">No openings right now</h3>
            <p className="font-body text-sm text-muted-foreground">
              We're not hiring for this category at the moment. Check back soon or send us your resume at{" "}
              <a href="mailto:careers@jtapkitchen.com" className="text-primary hover:underline">
                careers@jtapkitchen.com
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([dept, deptJobs]) => (
              <div key={dept}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-heading text-xl font-bold text-foreground">{dept}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary font-body">
                    {deptJobs.length} opening{deptJobs.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-4">
                  {deptJobs.map(job => (
                    <JobCard key={job.id} job={job} onApply={setApplyingTo} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* General CTA */}
        <div className="mt-14 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="font-heading text-lg font-bold mb-2">Don't see the right fit?</h3>
          <p className="font-body text-sm text-muted-foreground mb-4">
            We're always looking for passionate people. Send your resume and we'll keep you in mind.
          </p>
          <a
            href="mailto:careers@jtapkitchen.com"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Send Your Resume
          </a>
        </div>
      </div>

      {/* Application Modal */}
      <AnimatePresence>
        {applyingTo && (
          <ApplicationModal job={applyingTo} onClose={() => setApplyingTo(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}