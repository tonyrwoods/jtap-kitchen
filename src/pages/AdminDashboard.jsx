import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useRobotsNoindex from "@/hooks/useRobotsNoindex";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  UtensilsCrossed, CalendarDays,
  Plus, Pencil, Trash2, CheckCircle, XCircle, Clock, Gift, Upload
} from "lucide-react";
import LoyaltyAdminTab from "../components/LoyaltyAdminTab";
import SeoTab from "../components/admin/SeoTab";
import ReservationsCalendarView from "../components/admin/ReservationsCalendarView";
import StaffRosterTab from "../components/admin/StaffRosterTab";
import InventoryAdminTab from "../components/admin/InventoryAdminTab";
import FeedbackManagementTab from "../components/admin/FeedbackManagementTab";
import VendorPaymentsTab from "../components/admin/VendorPaymentsTab";
import AuditReportTab from "../components/admin/AuditReportTab";
import FeaturedDishesTab from "../components/admin/FeaturedDishesTab";
import TeamMembersTab from "../components/admin/TeamMembersTab";
import AdminCalendarTab from "../components/admin/AdminCalendarTab";
import WaitlistAdminTab from "../components/admin/WaitlistAdminTab";
import PricingStrategyTab from "../components/admin/PricingStrategyTab";
import GalleryAdminTab from "../components/admin/GalleryAdminTab";
import EventWaitlistTab from "../components/admin/EventWaitlistTab";
import LinkedInEventsTab from "../components/admin/LinkedInEventsTab";
import OpeningChecklistTab from "../components/admin/OpeningChecklistTab";
import InviteUserPanel from "../components/admin/InviteUserPanel";
import EndOfYearChecklistTab from "../components/admin/EndOfYearChecklistTab";
import CareersTab from "../components/admin/CareersTab";
import SelectDropdown from "../components/SelectDropdown";

const TAB_GROUPS = [
  { label: "Operations", tabs: ["Overview", "Opening Checklist", "End of Year Checklist"] },
  { label: "Menu & Pricing", tabs: ["Menu Items", "Pricing Strategy", "Chef Highlights"] },
  { label: "Reservations", tabs: ["Admin Calendar", "Reservations", "Calendar", "Event Waitlist"] },
  { label: "Staff", tabs: ["Staff Roster"] },
  { label: "Finance", tabs: ["Inventory", "Vendor Payments", "Reconciliation", "Audit Report"] },
  { label: "Guests", tabs: ["Gift Cards", "Reviews", "Feedback", "Loyalty"] },
  { label: "Marketing", tabs: ["Gallery", "Team Members", "LinkedIn", "SEO"] },
  { label: "Careers", tabs: ["Job Listings"] },
  { label: "Account", tabs: ["Profile"] },
];
const TABS = TAB_GROUPS.flatMap(g => g.tabs);
const STATUSES = ["Pending", "Confirmed", "Cancelled", "Completed"];
const CATEGORIES = ["Appetizers", "Salads & Sandwiches", "Entrees", "Sides", "Desserts", "Drinks"];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-body text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Pending: "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
    Completed: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function MenuItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || { name: "", category: "Starters", description: "", price: "", image_url: "", is_featured: false, dietary_tags: [] });
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price) || 0 };
    if (item?.id) {
      await base44.entities.MenuItem.update(item.id, data);
    } else {
      await base44.entities.MenuItem.create(data);
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{item?.id ? "Edit" : "Add"} Menu Item</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Name *</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Category *</label>
          <SelectDropdown value={form.category} onChange={v => set("category", v)} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
        </div>
        <div>
          <label className="font-body text-sm text-muted-foreground mb-1 block">Price (USD) *</label>
          <input type="number" step="0.01" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.price} onChange={e => set("price", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-2 block">Image</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="font-body text-sm text-muted-foreground">{uploading ? "Uploading..." : "Choose image"}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
            </label>
            {form.image_url && (
              <img src={form.image_url} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} className="rounded" />
          <label htmlFor="featured" className="font-body text-sm">Chef's Pick</label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  useRobotsNoindex();
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [menuItems, setMenuItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.MenuItem.list("-created_date", 100),
      base44.entities.Reservation.list("-created_date", 100),
      base44.entities.GiftCard.list("-created_date", 100),
      base44.entities.Review.list("-created_date", 100),
    ]).then(([m, r, g, rv]) => {
      setMenuItems(m);
      setReservations(r);
      setGiftCards(g);
      setReviews(rv);
      setLoading(false);
    });
  }, []);

  const refreshMenu = async () => {
    const m = await base44.entities.MenuItem.list("-created_date", 100);
    setMenuItems(m);
    setShowForm(false);
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    await base44.entities.MenuItem.delete(id);
    setMenuItems(prev => prev.filter(i => i.id !== id));
  };

  const updateResStatus = async (id, status) => {
    await base44.entities.Reservation.update(id, { status });
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };



  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Access Denied</h2>
          <p className="font-body text-muted-foreground mb-6">You need admin privileges to view this page.</p>
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

  const updateGiftCardStatus = async (id, status) => {
    const updates = { status };
    if (status === "Redeemed") {
      updates.redeemed_at = new Date().toISOString();
    }
    await base44.entities.GiftCard.update(id, updates);
    setGiftCards(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const GIFT_STATUSES = ["Pending Payment", "Active", "Redeemed", "Expired"];

  const stats = [
    { icon: UtensilsCrossed, label: "Menu Items", value: menuItems.length, color: "bg-primary" },
    { icon: Gift, label: "Gift Cards", value: giftCards.length, color: "bg-purple-500" },
    { icon: CalendarDays, label: "Total Reservations", value: reservations.length, color: "bg-blue-500" },
    { icon: Clock, label: "Pending", value: reservations.filter(r => r.status === "Pending").length, color: "bg-yellow-500" },
    { icon: CheckCircle, label: "Confirmed Today", value: reservations.filter(r => r.status === "Confirmed").length, color: "bg-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 lg:px-10 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Welcome back, {user?.full_name}</p>
          </div>
          <a href="/" className="font-body text-sm text-primary hover:underline">← Back to Site</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-end gap-1 border-b border-border min-w-max">
            {TAB_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-end">
                {gi > 0 && <div className="w-px h-5 bg-border mx-1 mb-3 shrink-0" />}
                <div className="flex flex-col">
                  <span className="font-body text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">{group.label}</span>
                  <div className="flex">
                    {group.tabs.map(t => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        aria-selected={tab === t}
                        role="tab"
                        className={`px-4 py-2.5 font-body text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap shrink-0 focus:outline-none ${
                          tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === "Overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {stats.map(s => <StatCard key={s.label} {...s} />)}
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold mb-4">Recent Reservations</h3>
                  <div className="space-y-3">
                    {reservations.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-body text-sm font-medium">{r.guest_name}</p>
                          <p className="font-body text-xs text-muted-foreground">{r.date} · {r.time} · {r.party_size} guests</p>
                        </div>
                        <StatusBadge status={r.status || "Pending"} />
                      </div>
                    ))}
                    {reservations.length === 0 && <p className="font-body text-sm text-muted-foreground">No reservations yet.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "Opening Checklist" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <OpeningChecklistTab />
              </motion.div>
            )}

            {tab === "End of Year Checklist" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EndOfYearChecklistTab />
              </motion.div>
            )}

            {tab === "Pricing Strategy" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PricingStrategyTab />
              </motion.div>
            )}

            {tab === "Admin Calendar" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminCalendarTab />
              </motion.div>
            )}

            {tab === "Event Waitlist" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EventWaitlistTab />
              </motion.div>
            )}

            {tab === "Menu Items" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {!showForm && (
                  <button onClick={() => { setEditingItem(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                )}
                {showForm && (
                  <MenuItemForm item={editingItem} onSave={refreshMenu} onCancel={() => { setShowForm(false); setEditingItem(null); }} />
                )}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                        <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Category</th>
                        <th className="text-left px-5 py-3 font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map(item => (
                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-body text-sm font-medium">{item.name}</p>
                            {item.is_featured && <span className="text-xs text-primary">Chef's Pick</span>}
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className="font-body text-sm text-muted-foreground">{item.category}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-heading text-sm font-semibold">${Number(item.price).toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="p-1.5 hover:text-primary transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteItem(item.id)} className="p-1.5 hover:text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {menuItems.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-10">No menu items yet.</p>}
                </div>
              </motion.div>
            )}

            {tab === "Reservations" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {reservations.map(r => (
                  <div key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-body font-semibold">{r.guest_name}</p>
                      <p className="font-body text-sm text-muted-foreground">{r.email} · {r.phone}</p>
                      <p className="font-body text-sm text-muted-foreground mt-1">{r.date} at {r.time} · {r.party_size} guests</p>
                      {r.special_requests && <p className="font-body text-xs text-muted-foreground mt-1 italic">"{r.special_requests}"</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status || "Pending"} />
                      <SelectDropdown value={r.status || "Pending"} onChange={v => updateResStatus(r.id, v)} options={STATUSES.map(s => ({ value: s, label: s }))} />
                    </div>
                  </div>
                ))}
                {reservations.length === 0 && (
                  <div className="text-center py-20">
                    <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-body text-muted-foreground">No reservations yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "Calendar" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: 600 }} className="flex flex-col">
                <ReservationsCalendarView reservations={reservations} loading={loading} />
              </motion.div>
            )}

            {tab === "Staff Roster" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: 600 }} className="flex flex-col">
                <StaffRosterTab />
              </motion.div>
            )}

            {tab === "Inventory" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <InventoryAdminTab />
              </motion.div>
            )}

            {tab === "Gift Cards" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Issued", value: giftCards.length, color: "bg-purple-500" },
                    { label: "Active", value: giftCards.filter(g => g.status === "Active").length, color: "bg-green-500" },
                    { label: "Redeemed", value: giftCards.filter(g => g.status === "Redeemed").length, color: "bg-blue-500" },
                  ].map(s => <StatCard key={s.label} icon={Gift} {...s} />)}
                </div>
                {giftCards.map(g => (
                  <div key={g.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-heading text-lg font-bold text-primary tracking-widest">{g.code}</span>
                        <span className="font-heading text-base font-semibold">${Number(g.amount).toFixed(2)}</span>
                      </div>
                      <p className="font-body text-sm text-muted-foreground">From: {g.purchaser_name} ({g.purchaser_email})</p>
                      {g.recipient_name && <p className="font-body text-sm text-muted-foreground">To: {g.recipient_name} ({g.recipient_email})</p>}
                      {g.status === "Redeemed" && g.redeemed_at && (
                        <p className="font-body text-xs text-muted-foreground mt-1">Redeemed: {new Date(g.redeemed_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={g.status || "Pending Payment"} />
                      <SelectDropdown value={g.status || "Pending Payment"} onChange={v => updateGiftCardStatus(g.id, v)} options={GIFT_STATUSES.map(s => ({ value: s, label: s }))} />
                    </div>
                  </div>
                ))}
                {giftCards.length === 0 && (
                  <div className="text-center py-20">
                    <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-body text-muted-foreground">No gift cards yet.</p>
                    <a href="/gift-cards" className="font-body text-sm text-primary hover:underline mt-2 block">View public gift card page →</a>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "Feedback" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <FeedbackManagementTab />
              </motion.div>
            )}

            {tab === "Vendor Payments" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <VendorPaymentsTab />
              </motion.div>
            )}

            {tab === "Reviews" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Reviews", value: reviews.length, color: "bg-primary" },
                    { label: "Pending", value: reviews.filter(r => r.status === "Pending").length, color: "bg-yellow-500" },
                    { label: "Featured", value: reviews.filter(r => r.is_featured).length, color: "bg-green-500" },
                  ].map(s => <StatCard key={s.label} icon={CheckCircle} {...s} />)}
                </div>
                {reviews.map(rv => (
                  <div key={rv.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-body font-semibold">{rv.guest_name}</span>
                        <span className="font-body text-xs text-yellow-500">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                        <StatusBadge status={rv.status || "Pending"} />
                        {rv.is_featured && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Featured</span>}
                      </div>
                      <p className="font-body text-sm text-muted-foreground italic mb-1">"{rv.comment}"</p>
                      {rv.visit_date && <p className="font-body text-xs text-muted-foreground">Visited: {rv.visit_date}</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <SelectDropdown
                        value={rv.status || "Pending"}
                        onChange={async v => {
                          await base44.entities.Review.update(rv.id, { status: v });
                          setReviews(prev => prev.map(r => r.id === rv.id ? { ...r, status: v } : r));
                        }}
                        options={["Pending", "Approved", "Rejected"].map(s => ({ value: s, label: s }))}
                      />
                      {rv.status === "Approved" && (
                        <button
                          onClick={async () => {
                            const updated = { is_featured: !rv.is_featured };
                            await base44.entities.Review.update(rv.id, updated);
                            setReviews(prev => prev.map(r => r.id === rv.id ? { ...r, ...updated } : r));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-colors ${
                            rv.is_featured ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                          }`}
                        >
                          {rv.is_featured ? "★ Featured" : "Feature"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-20">
                    <p className="font-body text-muted-foreground">No reviews yet.</p>
                    <a href="/submit-review" className="font-body text-sm text-primary hover:underline mt-2 block">View review submission page →</a>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "Loyalty" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <LoyaltyAdminTab />
              </motion.div>
            )}

            {tab === "Chef Highlights" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FeaturedDishesTab />
              </motion.div>
            )}

            {tab === "Team Members" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TeamMembersTab />
              </motion.div>
            )}

            {tab === "Gallery" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GalleryAdminTab />
              </motion.div>
            )}

            {tab === "LinkedIn" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <LinkedInEventsTab />
              </motion.div>
            )}

            {tab === "SEO" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SeoTab />
              </motion.div>
            )}

            {tab === "Job Listings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CareersTab />
              </motion.div>
            )}

            {tab === "Audit Report" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AuditReportTab />
              </motion.div>
            )}

            {tab === "Reconciliation" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-4">
                <p className="font-body text-muted-foreground">The Reconciliation Center is a dedicated workspace for matching bank transactions to invoices and vendor payments.</p>
                <a href="/reconciliation" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
                  Open Reconciliation Center →
                </a>
              </motion.div>
            )}

            {tab === "Profile" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-1">Email</p>
                      <p className="font-body text-sm font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-1">Full Name</p>
                      <p className="font-body text-sm font-medium">{user?.full_name}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-1">Role</p>
                      <p className="font-body text-sm font-medium capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <InviteUserPanel />

                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h4 className="font-heading text-lg font-semibold text-red-900 mb-2">Danger Zone</h4>
                  <p className="font-body text-sm text-red-800 mb-4">This action cannot be undone. Your account and all associated data will be permanently deleted.</p>
                  <button
                    onClick={() => {
                      if (confirm("Are you absolutely sure? This will permanently delete your account.")) {
                        toast.success("Account deletion requested. Contact support to confirm.");
                      }
                    }}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-body text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}