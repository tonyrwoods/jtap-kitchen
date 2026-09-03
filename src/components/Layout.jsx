import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import ReservationModal from "./ReservationModal";
import PullToRefresh from "./PullToRefresh";
import FloatingChat from "./FloatingChat";

const TAB_ROUTES = ["/", "/menu", "/gift-cards", "/events"];

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setShowScrollTop(el.scrollTop > 400);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset scroll and button on route change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setShowScrollTop(false);
  }, [location.pathname]);

  // Scroll to an in-page anchor (e.g. #reserve, #menu) when the hash changes.
  // The app uses a custom scroll container, so native browser anchor scrolling
  // doesn't fire — we handle it here via scrollIntoView on the target element.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, [location.hash, location.pathname]);

  const scrollToTop = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Detect dark mode preference
  useEffect(() => {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(darkModeQuery.matches);

    const handleChange = (e) => {
      setIsDark(e.matches);
      document.documentElement.classList.toggle("dark", e.matches);
    };

    darkModeQuery.addEventListener("change", handleChange);
    return () => darkModeQuery.removeEventListener("change", handleChange);
  }, []);

  // Hide footer on child routes (mobile optimization)
  const isChildRoute = location.pathname !== "/" &&
    !location.pathname.startsWith("/gift-cards") &&
    !location.pathname.startsWith("/events") &&
    location.pathname !== "/menu";

  const isTabRoute = TAB_ROUTES.some(route =>
    route === location.pathname ||
    (route !== "/#book" && location.pathname.startsWith(route.split("#")[0]))
  );

  const handleRefresh = async () => {
    // Refetch data based on current route
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-full focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to content
      </a>
      <Navbar onBookTable={() => setModalOpen(true)} showBackButton={!isTabRoute} />
      <main id="main-content" className="flex-1 pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} externalRef={scrollRef}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </PullToRefresh>
      </main>
      {!isChildRoute && <Footer onBookTable={() => setModalOpen(true)} />}
      <MobileTabBar />
      <ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <FloatingChat />
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-20 z-50 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Return to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}