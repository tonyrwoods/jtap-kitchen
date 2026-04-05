import { useState, useEffect } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { labelKey: "nav.menu", href: "#menu" },
  { labelKey: "nav.story", href: "#about" },
  { labelKey: "nav.gallery", href: "#gallery" },
  { labelKey: "nav.team", href: "#team" },
  { labelKey: "nav.reviews", href: "#reviews" },
  { labelKey: "nav.reserve", href: "#reserve" },
  { labelKey: "nav.events", href: "/events", isLink: true },
];

export default function Navbar({ onBookTable }) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <img
              src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/9fb891e3e_generated_image.png"
              alt="JTAP Kitchen Logo"
              className="h-20 w-20 rounded-full object-cover border border-primary/30"
            />
            <span className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              JTAP Kitchen
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.labelKey}
                href={link.href}
                className="font-body text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors duration-300 uppercase"
              >
                {t(link.labelKey)}
              </a>
            ))}
            <LanguageSwitcher />
          </div>

          {/* CTA */}
          <button
            onClick={onBookTable}
            className="hidden md:inline-flex items-center px-6 py-2.5 bg-primary text-primary-foreground font-body text-sm font-medium tracking-wide rounded-full hover:opacity-90 transition-opacity duration-300"
          >
            {t("nav.book")}
          </button>

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
              {NAV_LINKS.map((link) => (
                <a
                  key={link.labelKey}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-body text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {t(link.labelKey)}
                </a>
              ))}
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
  );
}