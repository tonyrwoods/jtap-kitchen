import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const OPENING_DATE = new Date("2026-08-12T17:00:00-05:00");

function getTimeLeft() {
  const now = new Date();
  const diff = OPENING_DATE - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isLive: false };
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center overflow-hidden">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="font-heading text-2xl sm:text-3xl font-bold text-white tabular-nums"
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </div>
      <span className="font-body text-[10px] sm:text-xs uppercase tracking-[0.15em] text-white/50 mt-2 font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function GrandOpeningCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.isLive) return null;

  return (
    <section className="relative py-16 px-6 bg-foreground overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(circle at 30% 50%, rgba(200,155,79,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(200,155,79,0.15) 0%, transparent 50%)" }} />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3"
        >
          The Countdown Is On
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-heading text-3xl sm:text-4xl font-bold text-white mb-2"
        >
          Grand Opening
        </motion.h2>
        <p className="font-body text-sm text-white/50 mb-10">
          August 12, 2026 — Memphis, TN
        </p>

        <div className="flex items-start justify-center gap-3 sm:gap-6">
          <TimeUnit value={timeLeft.days} label="Days" />
          <span className="font-heading text-2xl sm:text-3xl text-white/20 mt-5">:</span>
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <span className="font-heading text-2xl sm:text-3xl text-white/20 mt-5">:</span>
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <span className="font-heading text-2xl sm:text-3xl text-white/20 mt-5">:</span>
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
          <a
            href="/book"
            className="px-8 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
          >
            Reserve a Table
          </a>
          <a
            href="/tap-room-society"
            className="px-8 py-3.5 border-2 border-white/20 text-white font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all duration-300"
          >
            Join the Society
          </a>
        </div>
      </div>
    </section>
  );
}