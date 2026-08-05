import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Mail, Calendar, Clock, Users, Bookmark, Crown, Sparkles, LogOut, ChevronRight, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import ContactGroupsPanel from "@/components/account/ContactGroupsPanel";

const STATUS_STYLES = {
  Pending: { icon: Clock3, color: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
  Confirmed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Confirmed" },
  Cancelled: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", label: "Cancelled" },
  Completed: { icon: CheckCircle2, color: "text-slate-500", bg: "bg-slate-100", label: "Completed" },
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

export default function Account() {
  const { user, logout } = useAuth();

  useEffect(() => {
    document.title = "My Account — JTAP Kitchen";
  }, []);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["my-reservations", user?.email],
    queryFn: () => base44.entities.Reservation.filter({ email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const upcoming = reservations
    .filter((r) => r.status === "Pending" || r.status === "Confirmed")
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = reservations
    .filter((r) => r.status === "Completed" || r.status === "Cancelled")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero */}
      <div className="relative bg-foreground text-background py-16 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-3xl mx-auto flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading text-3xl font-bold shrink-0">
            {(user?.full_name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-1">My Account</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold truncate">{user?.full_name || "Member"}</h1>
            <p className="font-body text-sm text-background/60 truncate flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
            {memberSince && <p className="font-body text-xs text-background/40 mt-1">Member since {memberSince}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <ActionCard icon={Bookmark} label="Book a Table" href="/book" />
          <ActionCard icon={Crown} label="My Membership" href="/my-membership" />
          <ActionCard icon={Sparkles} label="Upgrade" href="/tap-room-society" />
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-destructive/40 hover:bg-destructive/5 transition-colors text-center"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="font-body text-xs font-medium text-destructive">Log Out</span>
          </button>
        </div>

        {/* Contact groups */}
        <ContactGroupsPanel />

        {/* Upcoming reservations */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Upcoming Reservations
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-body text-sm text-muted-foreground mb-4">No upcoming reservations yet.</p>
              <Link to="/book" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity">
                <Bookmark className="w-4 h-4" /> Book a Table
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r) => <ReservationCard key={r.id} r={r} />)}
            </div>
          )}
        </section>

        {/* Past reservations */}
        {past.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">History</h2>
            <div className="space-y-3">
              {past.map((r) => <ReservationCard key={r.id} r={r} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, label, href }) {
  return (
    <Link
      to={href}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-center group"
    >
      <Icon className="w-5 h-5 text-primary" />
      <span className="font-body text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}

function ReservationCard({ r }) {
  const style = STATUS_STYLES[r.status] || STATUS_STYLES.Pending;
  const StatusIcon = style.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
        <StatusIcon className={`w-6 h-6 ${style.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-foreground truncate">{formatDate(r.date)}</p>
        <p className="font-body text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.time}</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.party_size}</span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`font-body text-xs font-semibold ${style.color} ${style.bg} px-2.5 py-1 rounded-full`}>{style.label}</span>
        {r.confirm_token && (r.status === "Pending" || r.status === "Confirmed") && (
          <Link to={`/reserve/${r.confirm_token}`} className="font-body text-xs text-primary flex items-center gap-0.5 hover:underline">
            View <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}