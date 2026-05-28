import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { Menu, X, ChevronLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Primary nav links shown directly in the bar
const PRIMARY_LINKS = [
  { label: "Menu", href: "/menu" },
  { label: "Events", href: "/events" },
  { label: "Event Center", href: "/event-center" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Dining Assistant", href: "/dining-assistant" },
];

// Secondary links grouped under "More"
const MORE_LINKS = [
  { label: "Our Story", href: "/#about" },
  { label: "Reviews", href: "/submit-review" },
  { label: "Careers", href: "/careers" },
  { label: "Tap Room Society", href: "/tap-room-society" },
  { label: "My Membership", href: "/my-membership" },
  { label: "Founders Wall", href: "/founders" },
];

const ALL_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS];

function HiringBanner() {
  return (
    <div className="w-full bg-primary text-primary-foreground py-2 px-4 text-center z-40 relative">
      <p className="font-body text-xs sm:text-sm font-semibold tracking-wide">
        🍽️ NOW HIRING ALL POSITIONS —{" "}
        <Link to="/careers" className="underline underline-offset-2 hover:opacity-80 transition-opacity font-bold">
          Click here to apply
        </Link>
      </p>
    </div>
  );
}

export default function Navbar({ onBookTable, showBackButton = false }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shouldShowBackButton = isMobile && pathSegments.length > 1;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <HiringBanner />
      <nav
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50"
            : "bg-transparent"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Back Button or Logo */}
            {showBackButton || shouldShowBackButton ? (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 p-2 md:hidden text-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <a href="/" className="flex items-center gap-2.5">
                <img
                  src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/9fb891e3e_generated_image.png"
                  alt="JTAP Kitchen Logo"
                  className="h-20 w-20 rounded-full object-cover border border-primary/30"
                />
                <span className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  JTAP Kitchen
                </span>
              </a>
            )}
            {(showBackButton || shouldShowBackButton) && (
              <a href="/" className="hidden md:flex items-center gap-2.5">
                <img
                  src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/9fb891e3e_generated_image.png"
                  alt="JTAP Kitchen Logo"
                  className="h-20 w-20 rounded-full object-cover border border-primary/30"
                />
                <span className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  JTAP Kitchen
                </span>
              </a>
            )}

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-5">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`font-body text-sm font-medium tracking-wide transition-colors duration-300 uppercase ${
                    location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(o => !o)}
                  className={`flex items-center gap-1 font-body text-sm font-medium tracking-wide uppercase transition-colors duration-300 ${
                    MORE_LINKS.some(l => location.pathname === l.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  More <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-3 w-44 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      {MORE_LINKS.map((link) =>
                        link.href.startsWith("/") ? (
                          <Link
                            key={link.label}
                            to={link.href}
                            onClick={() => setMoreOpen(false)}
                            className={`block px-4 py-3 font-body text-sm font-medium transition-colors hover:bg-muted ${
                              location.pathname === link.href ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setMoreOpen(false)}
                            className="block px-4 py-3 font-body text-sm font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            {link.label}
                          </a>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side: CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onBookTable}
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground font-body text-sm font-medium tracking-wide rounded-full hover:opacity-90 transition-opacity duration-300"
              >
                {t("nav.book")}
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-foreground"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/98 backdrop-blur-lg border-b border-border"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {ALL_LINKS.map((link) =>
                  link.href.startsWith("/") ? (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="font-body text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="font-body text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  )
                )}
                <button
                  onClick={() => { setMobileOpen(false); onBookTable(); }}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-body text-sm font-medium tracking-wide rounded-full"
                >
                  {t("nav.book")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}