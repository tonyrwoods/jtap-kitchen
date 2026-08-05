import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, CalendarCheck, Bookmark, Sparkles, Crown, LogOut, LogIn } from "lucide-react";

const ITEMS = [
  { label: "Account", href: "/account", icon: User },
  { label: "My Reservations", href: "/account", icon: CalendarCheck },
  { label: "Book a Table", href: "/book", icon: Bookmark },
  { label: "My Membership", href: "/my-membership", icon: Crown },
  { label: "Upgrade", href: "/tap-room-society", icon: Sparkles },
];

export default function AccountMenu({ variant = "desktop" }) {
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const signIn = () => navigateToLogin();

  if (!isAuthenticated) {
    return (
      <button
        onClick={signIn}
        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </button>
    );
  }

  const initial = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  if (variant === "mobile") {
    return (
      <div className="border-t border-border pt-4 mt-2">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-semibold text-foreground truncate">{user?.full_name || "Member"}</p>
            <p className="font-body text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        {ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex items-center gap-3 py-3 font-body text-base font-medium text-foreground hover:text-primary transition-colors"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 py-3 font-body text-base font-medium text-destructive hover:opacity-80 transition-opacity w-full"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1 pr-2 rounded-full border border-border hover:bg-secondary transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold text-sm">
          {initial}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-60 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border bg-muted/40">
              <p className="font-body text-sm font-semibold text-foreground truncate">{user?.full_name || "Member"}</p>
              <p className="font-body text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              {ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 font-body text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full font-body text-sm font-medium text-destructive hover:bg-muted transition-colors border-t border-border"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}