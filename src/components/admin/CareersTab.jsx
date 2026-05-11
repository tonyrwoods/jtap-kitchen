import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["Front of House", "Back of House", "Management", "Bar", "Other"];
const EMP_TYPES = ["Full-time", "Part-time", "Seasonal"];
const APP_STATUSES = ["New", "Under Review", "Interview Scheduled", "Hired", "Rejected"];

const STATUS_COLORS = {
  "New": "bg-blue-100 text-blue-800",
  "Under Review": "bg-yellow-100 text-yellow-800",
  "Interview Scheduled": "bg-purple-100 text-purple-800",
  "Hired": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
};

function JobForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    title: "", department: "Front of House", employment_type: "Full-time",
    pay_range: "", description: "", requirements: "", is_active: true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (item?.id) {
      await base44.entities.JobListing.update(item.id, form);
    } else {
      await base44.entities.JobListing.create(form);
    }
    toast.success(item?.id ? "Listing updated" : "Listing created");
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "New"} Job Listing</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Job Title *</label>
          <input required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Fine Dining Server" />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Department</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.department} onChange={e => set("department", e.target.value)}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Employment Type</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.employment_type} onChange={e => set("employment_type", e.target.value)}>
            {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Pay Range</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.pay_range} onChange={e => set("pay_range", e.target.value)} placeholder="e.g. $18–$28/hr + tips" />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Job Description</label>
          <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
            value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the role..." />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Requirements</label>
          <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
            value={form.requirements} onChange={e => set("requirements", e.target.value)} placeholder="List requirements..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="rounded" />
          <label htmlFor="is_active" className="font-body text-sm">Active (visible to public)</label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

function ApplicationRow({ app }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(app.status || "New");

  const updateStatus = async (val) => {
    setStatus(val);
    await base44.entities.JobApplication.update(app.id, { status: val });
  };

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-5">
        <div>
          <p className="font-body text-sm font-semibold">{app.applicant_name}</p>
          <p className="font-body text-xs text-muted-foreground">{app.email} {app.phone ? `· ${app.phone}` : ""}</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Applied for: <span className="font-medium">{app.job_title}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || ""}`}>{status}</span>
          <select value={status} onChange={e => updateStatus(e.target.value)}
            className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background font-body">
            {APP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-4 space-y-2">
          {app.experience_years != null && (
            <p className="font-body text-sm text-muted-foreground">Experience: <span className="font-medium">{app.experience_years} yr(s)</span></p>
          )}
          {app.cover_letter && (
            <div>
              <p className="font-body text-xs font-semibold text-muted-foreground mb-1">Message:</p>
              <p className="font-body text-sm italic text-muted-foreground">"{app.cover_letter}"</p>
            </div>
          )}
          {app.resume_url && (
            <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
              className="inline-block font-body text-sm text-primary hover:underline">
              View Resume →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function CareersTab() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [view, setView] = useState("listings");

  const load = async () => {
    const [j, a] = await Promise.all([
      base44.entities.JobListing.list("-created_date", 100),
      base44.entities.JobApplication.list("-created_date", 200),
    ]);
    setJobs(j);
    setApplications(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteJob = async (id) => {
    await base44.entities.JobListing.delete(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const onSave = () => { setShowForm(false); setEditingJob(null); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["listings", "applications"].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full font-body text-sm font-medium capitalize transition-colors ${
                view === v ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
              }`}>
              {v} {v === "applications" && `(${applications.length})`}
            </button>
          ))}
        </div>
        {view === "listings" && !showForm && (
          <button onClick={() => { setEditingJob(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Listing
          </button>
        )}
      </div>

      {showForm && (
        <JobForm item={editingJob} onSave={onSave} onCancel={() => { setShowForm(false); setEditingJob(null); }} />
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : view === "listings" ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Dept</th>
                <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-body text-sm font-medium">{job.title}</td>
                  <td className="px-5 py-3 font-body text-sm text-muted-foreground hidden sm:table-cell">{job.department}</td>
                  <td className="px-5 py-3 font-body text-sm text-muted-foreground hidden md:table-cell">{job.employment_type}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${job.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {job.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditingJob(job); setShowForm(true); }} className="p-1.5 hover:text-primary transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="p-1.5 hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-10">No listings yet. Click "Add Listing" to create one.</p>}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {applications.length === 0
            ? <p className="font-body text-sm text-muted-foreground text-center py-10">No applications yet.</p>
            : applications.map(app => <ApplicationRow key={app.id} app={app} />)
          }
        </div>
      )}
    </div>
  );
}