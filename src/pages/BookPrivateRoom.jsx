import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Lock, CheckCircle2 } from "lucide-react";

const GOLD = "#C89B4F";
const DAYS_ALLOWED = ["Sunday", "Monday", "Tuesday"];

const RENTAL_RATES = {
  "Tap Member":      { Sunday: 300, Monday: 250, Tuesday: 200 },
  "Reserve Member":  { Sunday: 200, Monday: 150, Tuesday: 100 },
  "Founding Member": { Sunday: 100, Monday: 100, Tuesday: 100 },
};
const DEPOSIT = { "Tap Member": 200, "Reserve Member": 150, "Founding Member": 100 };
const FB_MIN = { "Tap Member": 500, "Reserve Member": 400, "Founding Member": 300 };

function getDayOfWeek(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
}

function buildTimeOptions() {
  const times = [];
  for (let h = 17; h <= 23; h++) {
    times.push(`${String(h).padStart(2,"0")}:00`);
    if (h < 23) times.push(`${String(h).padStart(2,"0")}:30`);
  }
  return times;
}
const TIME_OPTIONS = buildTimeOptions();

const STATUS_COLORS = {
  Inquiry: "#94a3b8", Tentative: "#f59e0b", Confirmed: "#22c55e", Completed: "#6366f1", Cancelled: "#ef4444"
};

const inputStyle = { background: "#252525", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function BookPrivateRoom() {
  useEffect(() => {
    document.title = "Book Private Room — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Book the JTAP Kitchen private room for your event. Exclusive dining space available Sunday through Tuesday for Tap Room Society members.");
  }, []);
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    event_date: "", start_time: "18:00", end_time: "21:00",
    event_type: "Birthday", guest_count: "",
    special_requests: "", av_needed: false, floral_needed: false, use_free_rental: false
  });
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: authUser } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });

  const { data: members = [] } = useQuery({
    queryKey: ["my-membership", authUser?.email],
    queryFn: () => base44.entities.TapRoomMember.filter({ email: authUser.email }),
    enabled: !!authUser?.email,
  });
  const member = members[0] || null;

  const { data: myBookings = [] } = useQuery({
    queryKey: ["my-bookings", member?.email],
    queryFn: () => base44.entities.PrivateRoomRental.filter({ member_email: member.email }),
    enabled: !!member?.email,
  });

  const createBooking = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitPrivateRoomBooking', data),
    onSuccess: (res) => {
      if (res.data?.success) {
        qc.invalidateQueries({ queryKey: ["my-bookings"] });
        setSubmitted(true);
      } else {
        toast.error(res.data?.error || "Booking failed.");
      }
    },
    onError: () => toast.error("Booking failed. Please try again."),
  });

  const selectedDay = getDayOfWeek(form.event_date);
  const invalidDay = form.event_date && !DAYS_ALLOWED.includes(selectedDay);
  const tier = member?.tier || "Tap Member";
  const rates = RENTAL_RATES[tier] || RENTAL_RATES["Tap Member"];
  const rentalRate = form.use_free_rental ? 0 : (rates[selectedDay] || 0);
  const depositAmt = DEPOSIT[tier] || 200;
  const fbMin = FB_MIN[tier] || 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?.private_room_access) { toast.error("You don't have private room access."); return; }
    if (invalidDay) { toast.error("Please select a Sunday, Monday, or Tuesday."); return; }
    if (!form.event_date || !form.guest_count) { toast.error("Date and guest count are required."); return; }
    createBooking.mutate({
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      event_type: form.event_type,
      guest_count: parseInt(form.guest_count) || 0,
      special_requests: form.special_requests,
      av_needed: form.av_needed,
      floral_needed: form.floral_needed,
      use_free_rental: form.use_free_rental,
    });
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0d" }}>
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD }} />
          <p className="font-heading text-2xl text-white mb-4">Sign in to book the private room</p>
          <button onClick={() => base44.auth.redirectToLogin("/book-private-room")}
            className="px-8 py-3 rounded-full font-body font-bold text-sm" style={{ background: GOLD, color: "#0a0a0a" }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (member && !member.private_room_access) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0d0d0d" }}>
        <div className="text-center max-w-md">
          <Lock className="w-14 h-14 mx-auto mb-5" style={{ color: "rgba(200,155,79,0.3)" }} />
          <h2 className="font-heading text-3xl font-bold text-white mb-3">Private Room Access Required</h2>
          <p className="font-body mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Private Room access is a Reserve Member perk. Upgrade to unlock exclusive booking.
          </p>
          <Link to="/tap-room-society" className="inline-block px-8 py-3 rounded-full font-body font-bold text-sm"
            style={{ background: GOLD, color: "#0a0a0a" }}>
            Upgrade Membership
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#fff" }}>
      <div className="px-6 py-14" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1208)", borderBottom: `1px solid ${GOLD}30` }}>
        <div className="max-w-4xl mx-auto">
          <p className="font-body text-xs uppercase tracking-widest mb-2" style={{ color: GOLD }}>Member Exclusive</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">THE PRIVATE ROOM</h1>
          <p className="font-body text-sm mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
            Available to Reserve and Founding Members · Sunday evenings, Mondays, and Tuesdays
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {submitted ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "#1a1a1a", border: `1px solid ${GOLD}30` }}>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-5" style={{ color: GOLD }} />
            <h3 className="font-heading text-2xl font-bold mb-3">Booking Request Submitted!</h3>
            <p className="font-body mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              Our team will confirm within 24 hours.
            </p>
            <button onClick={() => setSubmitted(false)}
              className="px-8 py-3 rounded-full font-body font-bold text-sm"
              style={{ background: GOLD, color: "#0a0a0a" }}>
              Book Another Date
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
              {/* Member Info */}
              <div className="rounded-2xl p-6" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Member Info</p>
                <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <p>Name: <span className="text-white font-semibold">{member?.guest_name || "—"}</span></p>
                  <p>Email: <span className="text-white font-semibold">{member?.email || "—"}</span></p>
                  <p>Tier: <span style={{ color: GOLD }}>{tier}</span></p>
                  <p>Free Rentals: <span style={{ color: GOLD }}>{member?.free_rentals_remaining || 0}</span></p>
                </div>
              </div>

              {/* Event Details */}
              <div className="rounded-2xl p-6 space-y-5" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="font-body text-xs uppercase tracking-widest" style={{ color: GOLD }}>Event Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="font-body text-sm mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>Event Date *</label>
                    <input type="date" min={today} value={form.event_date} onChange={e => set("event_date", e.target.value)} required
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                    {invalidDay && <p className="font-body text-xs mt-1 text-red-400">Only Sun, Mon, Tue available</p>}
                    {form.event_date && !invalidDay && <p className="font-body text-xs mt-1" style={{ color: GOLD }}>{selectedDay}</p>}
                  </div>
                  <div>
                    <label className="font-body text-sm mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>Event Type</label>
                    <select value={form.event_type} onChange={e => set("event_type", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                      {["Birthday","Anniversary","Corporate Dinner","Business Meeting","Private Party","Celebration","Other"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>Start Time</label>
                    <select value={form.start_time} onChange={e => set("start_time", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>End Time</label>
                    <select value={form.end_time} onChange={e => set("end_time", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-body text-sm mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>Expected Guest Count *</label>
                    <input type="number" min="1" max="150" required value={form.guest_count} onChange={e => set("guest_count", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} placeholder="e.g. 30" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-body text-sm mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>Special Requests</label>
                    <textarea rows={3} value={form.special_requests} onChange={e => set("special_requests", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" style={inputStyle}
                      placeholder="Setup notes, catering preferences, special arrangements..." />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.av_needed} onChange={e => set("av_needed", e.target.checked)} className="w-4 h-4 accent-amber-500" />
                    <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>AV Equipment Needed (projector, microphone, etc.)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.floral_needed} onChange={e => set("floral_needed", e.target.checked)} className="w-4 h-4 accent-amber-500" />
                    <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>Floral / Decor Needed</span>
                  </label>
                  {(member?.free_rentals_remaining || 0) > 0 && (
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl"
                      style={{ border: `1px solid ${GOLD}30`, background: `${GOLD}08` }}>
                      <input type="checkbox" checked={form.use_free_rental} onChange={e => set("use_free_rental", e.target.checked)} className="w-4 h-4 mt-0.5 accent-amber-500" />
                      <span className="font-body text-sm" style={{ color: GOLD }}>
                        Use 1 of my {member.free_rentals_remaining} complimentary rental{member.free_rentals_remaining > 1 ? "s" : ""}
                        {selectedDay && rates[selectedDay] ? ` (saves $${rates[selectedDay]})` : ""}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" disabled={createBooking.isPending || invalidDay}
                className="w-full py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: GOLD, color: "#0a0a0a" }}>
                {createBooking.isPending ? "Submitting..." : "REQUEST BOOKING"}
              </button>
            </form>

            {/* PRICING PANEL */}
            <div>
              <div className="rounded-2xl p-6 sticky top-24" style={{ background: "#1a1a1a", border: `1px solid ${GOLD}30` }}>
                <p className="font-body text-xs uppercase tracking-widest mb-5" style={{ color: GOLD }}>Pricing Preview</p>
                {selectedDay && DAYS_ALLOWED.includes(selectedDay) ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Rental Rate ({selectedDay})</span>
                      <span className="font-body text-sm font-bold text-white">{form.use_free_rental ? "FREE" : `$${rates[selectedDay]}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Food Min.</span>
                      <span className="font-body text-sm font-bold text-white">${fbMin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Deposit Required</span>
                      <span className="font-body text-sm font-bold text-white">${depositAmt}</span>
                    </div>
                    <div className="pt-4" style={{ borderTop: `1px solid ${GOLD}30` }}>
                      <div className="flex justify-between">
                        <span className="font-body text-sm font-bold" style={{ color: GOLD }}>Est. Total</span>
                        <span className="font-body text-sm font-bold" style={{ color: GOLD }}>${(rentalRate + fbMin).toLocaleString()}+</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Select a valid date to see pricing</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MY BOOKINGS */}
        {myBookings.length > 0 && (
          <div className="mt-14 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-6 py-4" style={{ background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-body text-xs uppercase tracking-widest" style={{ color: GOLD }}>My Bookings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ background: "#141414" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Date","Day","Event","Guests","Rate","Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-body text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...myBookings].sort((a,b) => new Date(b.event_date) - new Date(a.event_date)).map((b, i) => (
                    <tr key={b.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-5 py-3 font-body text-sm text-white">{b.event_date}</td>
                      <td className="px-5 py-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{b.day_of_week}</td>
                      <td className="px-5 py-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{b.event_type}</td>
                      <td className="px-5 py-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{b.guest_count}</td>
                      <td className="px-5 py-3 font-body text-sm" style={{ color: GOLD }}>{b.is_free_rental ? "FREE" : `$${b.rental_rate}`}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 rounded-full font-body text-xs font-bold"
                          style={{ background: `${STATUS_COLORS[b.status] || "#666"}20`, color: STATUS_COLORS[b.status] || "#666" }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}