import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Percent, Lock, CalendarDays, Gift, Star, Award,
  CheckCircle2, XCircle, Crown, Camera
} from "lucide-react";

const GOLD = "#C89B4F";
const DARK = "#1a1a1a";
const CHAR = "#2a2a2a";

const PERKS = [
  { icon: Percent, title: "Discounts on Every Meal", desc: "10% to 20% off based on your tier. Every visit, automatically." },
  { icon: Lock, title: "Private Room & Bar Access", desc: "Reserved for members only. Step behind the velvet rope." },
  { icon: CalendarDays, title: "Rent the Space", desc: "Book the private room on Sunday, Monday, or Tuesday." },
  { icon: Gift, title: "Birthday Reward", desc: "$30 on us. Every year. No strings attached." },
  { icon: Star, title: "Members-Only Events", desc: "First access before the public ever hears about it." },
  { icon: Award, title: "Founding Member Status", desc: "Your name on the wall. Literally. Forever." },
];

const TIERS = [
  { name: "Regular", price: "Free", sub: "Always free", color: "#9ca3af" },
  { name: "Tap Member", price: "Free / Earned", sub: "By spend", color: "#cd7f32" },
  { name: "Reserve Member", price: "$99/yr", sub: "or earned", color: "#94a3b8", featured: true },
  { name: "Founding Member", price: "$249/yr", sub: "Invite only", color: GOLD },
];

const TABLE_ROWS = [
  { label: "Points Earning", values: ["1× per $1", "1.5× per $1", "2× per $1", "3× per $1"] },
  { label: "Birthday Reward", values: ["—", "$10", "$20", "$30"] },
  { label: "Food Discount", values: ["—", "10%", "15%", "20%"] },
  { label: "Private Room Access", values: [false, false, true, true] },
  { label: "Rent the Space", values: [false, false, true, "2 free/yr"] },
  { label: "Wall of Founders", values: [false, false, false, true] },
];

const TODAY = new Date().toISOString().split("T")[0];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function generateReferralCode(name) {
  const clean = name.replace(/\s+/g,"").toUpperCase().slice(0,4);
  return clean + Math.random().toString(36).slice(2,6).toUpperCase();
}

export default function TapRoomSociety() {
  const joinRef = useRef(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    guest_name: "", email: "", phone: "",
    birthday_month: "", birthday_day: "",
    how_heard: "", tier: "Regular", referred_by_code: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: founders = [] } = useQuery({
    queryKey: ["founding-wall-count"],
    queryFn: () => base44.entities.FoundingMemberWall.list(),
  });
  const foundingCount = founders.length;
  const spotsLeft = Math.max(0, 20 - foundingCount);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.email) { toast.error("Name and email are required."); return; }
    setSubmitting(true);
    const tierData = {
      "Regular": { private_room_access: false, free_rentals_remaining: 0, welcome_credit_issued: 0, welcome_credit_remaining: 0, annual_fee_amount: 0, is_founding_member: false, tier_earned_or_paid: "Free" },
      "Reserve Member": { private_room_access: true, free_rentals_remaining: 1, welcome_credit_issued: 50, welcome_credit_remaining: 50, annual_fee_amount: 99, is_founding_member: false, tier_earned_or_paid: "Paid Annual Fee" },
      "Founding Member": { private_room_access: true, free_rentals_remaining: 2, welcome_credit_issued: 100, welcome_credit_remaining: 100, annual_fee_amount: 249, is_founding_member: true, tier_earned_or_paid: "Paid Annual Fee" },
    }[form.tier] || {};
    await base44.entities.TapRoomMember.create({
      ...form,
      tier: form.tier,
      birthday_month: form.birthday_month ? parseInt(form.birthday_month) : undefined,
      birthday_day: form.birthday_day ? parseInt(form.birthday_day) : undefined,
      joined_date: TODAY,
      status: "Active",
      points_balance: 0,
      total_visits: 0,
      total_spend: 0,
      referral_code: generateReferralCode(form.guest_name),
      ...tierData,
    });
    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: "Welcome to The Tap Room Society — JTAP Kitchen",
      body: `Hi ${form.guest_name},\n\nYou're officially in.\n\nWelcome to The Tap Room Society.\n\nYour tier: ${form.tier}\n${tierData.welcome_credit_issued > 0 ? `Welcome credit: $${tierData.welcome_credit_issued}\n` : ""}${tierData.private_room_access ? "Private Room Access: UNLOCKED\n" : ""}\nSee you at the table.\n\n— The JTAP Kitchen Team`
    });
    setSubmitted(true);
    setTimeout(() => navigate("/my-membership"), 1500);
    setSubmitting(false);
  };

  const scrollToJoin = () => joinRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen" style={{ background: DARK, color: "#fff" }}>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24"
        style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 100%)" }}>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-body text-xs uppercase tracking-[0.4em] mb-6" style={{ color: GOLD }}>
          JTAP Kitchen · Members Only
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          THERE&apos;S A ROOM<br />IN THE BACK.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-body text-xl md:text-2xl mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
          You&apos;ve earned the right to be in it.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 mb-10">
          <button onClick={scrollToJoin}
            className="px-10 py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase border-2 transition-all hover:opacity-90"
            style={{ borderColor: GOLD, color: GOLD }}>
            JOIN FREE TODAY
          </button>
          <button onClick={scrollToJoin}
            className="px-10 py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90"
            style={{ background: GOLD, color: "#0a0a0a" }}>
            BECOME RESERVE MEMBER
          </button>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="font-body text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Introducing The Tap Room Society — JTap Kitchen&apos;s members-only loyalty program.
        </motion.p>
      </section>

      {/* THE HOOK */}
      <section className="py-24 px-6" style={{ background: "#111" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl flex items-center justify-center h-72 md:h-96"
            style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.2)" }}>
            <Camera className="w-16 h-16" style={{ color: "rgba(200,155,79,0.3)" }} />
          </div>
          <div>
            <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>The Philosophy</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">This isn&apos;t a punch card.</h2>
            <p className="font-body text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
              The Tap Room Society is built for people who actually show up. Earn real rewards. Unlock real access.
              The more you visit, the more JTap Kitchen becomes yours.
            </p>
            <button onClick={scrollToJoin}
              className="px-8 py-3.5 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90"
              style={{ background: GOLD, color: "#0a0a0a" }}>
              JOIN THE SOCIETY
            </button>
          </div>
        </div>
      </section>

      {/* PERKS GRID */}
      <section className="py-24 px-6" style={{ background: CHAR }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: GOLD }}>Membership Perks</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold">What you unlock.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-2xl p-7 flex flex-col gap-4"
                style={{ background: "#333", border: "1px solid rgba(200,155,79,0.15)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,155,79,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <h3 className="font-heading text-lg font-bold">{title}</h3>
                <p className="font-body text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TIER TABLE */}
      <section className="py-24 px-6" style={{ background: "#fff", color: "#1a1a1a" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: GOLD }}>Compare</p>
            <h2 className="font-heading text-4xl font-bold">Find your tier — Every visit moves you up.</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 font-body text-sm text-gray-400">Feature</th>
                  {TIERS.map(t => (
                    <th key={t.name} className="py-4 px-4 text-center">
                      <div className="rounded-xl py-3 px-2" style={{ background: t.featured ? CHAR : "#f5f5f5" }}>
                        <p className="font-heading text-base font-bold" style={{ color: t.color }}>{t.name}</p>
                        <p className="font-body text-sm font-semibold mt-0.5" style={{ color: t.featured ? "rgba(255,255,255,0.8)" : "#111" }}>{t.price}</p>
                        <p className="font-body text-xs mt-0.5" style={{ color: t.featured ? "rgba(255,255,255,0.4)" : "#888" }}>{t.sub}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row) => (
                  <tr key={row.label} style={{ borderTop: "1px solid #eee" }}>
                    <td className="py-3.5 px-4 font-body text-sm font-medium text-gray-700">{row.label}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="py-3.5 px-4 text-center">
                        {v === true ? <CheckCircle2 className="w-5 h-5 mx-auto" style={{ color: GOLD }} /> :
                          v === false ? <XCircle className="w-4 h-4 mx-auto text-gray-300" /> :
                            <span className="font-body text-sm font-semibold" style={{ color: TIERS[j].color }}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid #eee" }}>
                  <td className="py-4 px-4" />
                  {TIERS.map(t => (
                    <td key={t.name} className="py-4 px-4 text-center">
                      <button onClick={scrollToJoin}
                        className="px-4 py-2 rounded-full font-body text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90"
                        style={{ background: t.featured ? GOLD : "transparent", color: t.featured ? "#0a0a0a" : GOLD, border: `1.5px solid ${GOLD}` }}>
                        {t.name === "Founding Member" ? "Request Invite" : "Join"}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRIVATE ROOM */}
      <section className="py-24 px-6" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Exclusive Access</p>
            <h2 className="font-heading text-5xl md:text-6xl font-bold mb-6" style={{ color: GOLD }}>THE ROOM</h2>
            <p className="font-body text-lg leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
              Private dining. Private bar. Yours to book. Reserve Members and above can access our private dining room and bar any time they visit.
            </p>
            <ul className="space-y-2 mb-8">
              {["Sunday Evenings","Mondays","Tuesdays","Birthdays","Anniversaries","Business Dinners"].map(d => (
                <li key={d} className="flex items-center gap-3 font-body text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span style={{ color: GOLD }}>›</span> {d}
                </li>
              ))}
            </ul>
            <Link to="/book-private-room"
              className="inline-block px-8 py-3.5 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90"
              style={{ background: GOLD, color: "#0a0a0a" }}>
              BOOK THE PRIVATE ROOM
            </Link>
          </div>
          <div className="rounded-2xl flex items-center justify-center h-80"
            style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.2)" }}>
            <Camera className="w-16 h-16" style={{ color: "rgba(200,155,79,0.3)" }} />
          </div>
        </div>
      </section>

      {/* FOUNDING SCARCITY */}
      <section className="py-24 px-6 text-center" style={{ background: CHAR }}>
        <div className="max-w-2xl mx-auto">
          <Crown className="w-12 h-12 mx-auto mb-6" style={{ color: GOLD }} />
          <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: GOLD }}>Limited Availability</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">BE PART OF THE BEGINNING.</h2>
          <p className="font-body text-lg mb-10" style={{ color: "rgba(255,255,255,0.6)" }}>
            Founding Memberships are limited to 20 people. Your name goes on the wall. Literally.
            This offer closes when the spots are gone.
          </p>
          <div className="rounded-2xl p-8 mb-8" style={{ background: "#1e1e1e", border: "1px solid rgba(200,155,79,0.2)" }}>
            <p className="font-heading text-3xl font-bold mb-2" style={{ color: GOLD }}>
              {foundingCount} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1.25rem" }}>of 20 claimed</span>
            </p>
            <div className="w-full rounded-full h-3 mt-4" style={{ background: "#333" }}>
              <div className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((foundingCount / 20) * 100, 100)}%`, background: `linear-gradient(to right, ${GOLD}, #e8b86d)` }} />
            </div>
            <p className="font-body text-sm mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              {spotsLeft > 0 ? `${spotsLeft} spots remaining` : "All spots claimed"}
            </p>
          </div>
          <button onClick={scrollToJoin}
            className="px-10 py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90"
            style={{ background: GOLD, color: "#0a0a0a" }}>
            REQUEST YOUR FOUNDING INVITE
          </button>
        </div>
      </section>

      {/* SIGN-UP FORM */}
      <section ref={joinRef} id="join" className="py-24 px-6" style={{ background: "#fff", color: "#1a1a1a" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: GOLD }}>Get Started</p>
            <h2 className="font-heading text-4xl font-bold">JOIN THE TAP ROOM SOCIETY.</h2>
            <p className="font-body text-sm text-gray-500 mt-2">It&apos;s free to join. Upgrade any time.</p>
          </div>
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 rounded-2xl" style={{ background: "#0d0d0d" }}>
              <Crown className="w-14 h-14 mx-auto mb-5" style={{ color: GOLD }} />
              <h3 className="font-heading text-2xl font-bold text-white mb-3">Welcome to The Tap Room Society!</h3>
              <p className="font-body mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Check your email for next steps.</p>
              <Link to="/my-membership"
                className="inline-block px-8 py-3 rounded-full font-body font-bold text-sm"
                style={{ background: GOLD, color: "#0a0a0a" }}>
                View My Dashboard
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5"
              style={{ background: "#f9f9f9", border: "1px solid #e5e5e5" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Full Name *</label>
                  <input required value={form.guest_name} onChange={e => set("guest_name", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none"
                    placeholder="Your full name" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Phone</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none"
                    placeholder="(901) 555-0000" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">How did you hear about us?</label>
                  <select value={form.how_heard} onChange={e => set("how_heard", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none">
                    <option value="">Select...</option>
                    {["Friend/Referral","Instagram","In-Restaurant","Google","Email","Other"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Birthday Month</label>
                  <select value={form.birthday_month} onChange={e => set("birthday_month", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none">
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm font-semibold mb-1 block">Birthday Day</label>
                  <select value={form.birthday_day} onChange={e => set("birthday_day", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none">
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-3 block">Membership Tier</label>
                <div className="space-y-3">
                  {[
                    { value: "Regular", label: "Regular (Free)", sub: "Earn points and get access to member perks" },
                    { value: "Reserve Member", label: "Reserve Member ($99/yr)", sub: "$50 food credit included · Private room access · 1 free rental" },
                    { value: "Founding Member", label: "Founding Member ($249/yr)", sub: "By invite only · Limited spots · $100 credit · 2 free rentals · Wall of Founders" },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                      style={{ border: `1.5px solid ${form.tier === opt.value ? GOLD : "#e5e5e5"}`, background: form.tier === opt.value ? `${GOLD}08` : "#fff" }}>
                      <input type="radio" name="tier" value={opt.value} checked={form.tier === opt.value} onChange={e => set("tier", e.target.value)} className="mt-1" />
                      <div>
                        <p className="font-body text-sm font-bold">{opt.label}</p>
                        <p className="font-body text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-semibold mb-1 block">Referral Code (optional)</label>
                <input value={form.referred_by_code} onChange={e => set("referred_by_code", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none"
                  placeholder="Enter a member's referral code" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-full font-body font-bold text-sm tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: GOLD, color: "#0a0a0a" }}>
                {submitting ? "Creating Your Membership..." : "CREATE MY MEMBERSHIP"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="py-16 px-6 text-center" style={{ background: "#0a0a0a" }}>
        <Link to="/founders" className="font-body text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          View the Founders Wall →
        </Link>
      </section>
    </div>
  );
}