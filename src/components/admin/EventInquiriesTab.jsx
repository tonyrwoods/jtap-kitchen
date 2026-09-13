import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Trash2, Mail, Phone, Users, CalendarDays, MessageSquare, Filter } from "lucide-react";
import SelectDropdown from "@/components/SelectDropdown";

const STATUSES = ["New", "Confirmed", "Talent Pending", "Declined"];

const STATUS_COLORS = {
  "New": "bg-blue-100 text-blue-800",
  "Confirmed": "bg-green-100 text-green-800",
  "Talent Pending": "bg-amber-100 text-amber-800",
  "Declined": "bg-red-100 text-red-800",
};

export default function EventInquiriesTab() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.EventCenterInquiry.list("-created_date", 200);
    setInquiries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.EventCenterInquiry.update(id, { status });
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    toast.success(`Marked ${status}`);
  };

  const remove = async (id) => {
    if (!confirm("Delete this inquiry?")) return;
    await base44.entities.EventCenterInquiry.delete(id);
    setInquiries(prev => prev.filter(i => i.id !== id));
    toast.success("Inquiry deleted");
  };

  const filtered = filter === "All" ? inquiries : inquiries.filter(i => (i.status || "New") === filter);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <SelectDropdown value={filter} onChange={setFilter} options={[{ value: "All", label: "All Statuses" }, ...STATUSES.map(s => ({ value: s, label: s }))]} />
        <span className="font-body text-sm text-muted-foreground">{filtered.length} inquiry{filtered.length !== 1 ? "ies" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No event inquiries yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(i => (
            <div key={i.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[i.status || "New"] || "bg-muted text-muted-foreground"}`}>
                    {i.status || "New"}
                  </span>
                  <p className="font-body font-semibold text-foreground">{i.contact_name}</p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 font-body text-sm text-muted-foreground">
                  {i.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {i.email}</span>}
                  {i.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {i.phone}</span>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 font-body text-sm text-muted-foreground">
                  {i.event_type && <span>{i.event_type}</span>}
                  {i.preferred_day && <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {i.preferred_day}</span>}
                  {i.preferred_date && <span>{i.preferred_date}</span>}
                  {i.guest_count != null && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {i.guest_count} guests</span>}
                </div>
                {i.package && i.package !== "Not Sure" && (
                  <p className="font-body text-sm"><span className="text-muted-foreground">Package:</span> <span className="font-medium">{i.package}</span></p>
                )}
                {i.message && (
                  <p className="font-body text-sm text-muted-foreground flex items-start gap-1.5 pt-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="italic">{i.message}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <SelectDropdown value={i.status || "New"} onChange={v => updateStatus(i.id, v)} options={STATUSES.map(s => ({ value: s, label: s }))} />
                <button onClick={() => remove(i.id)} className="p-1.5 hover:text-destructive transition-colors" aria-label="Delete inquiry">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}