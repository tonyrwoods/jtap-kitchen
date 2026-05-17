import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import ReservationModal from "./ReservationModal";
import PullToRefresh from "./PullToRefresh";

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

  const shouldShowPullToRefresh = isTabRoute;

  const handleRefresh = async () => {
    // Refetch data based on current route
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <Navbar onBookTable={() => setModalOpen(true)} showBackButton={!isTabRoute} />
      <main className="flex-1 pt-20 pb-20 md:pb-0 overflow-hidden">
        {shouldShowPullToRefresh ? (
          <PullToRefresh onRefresh={handleRefresh}>
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
        ) : (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            ref={scrollRef}
            className="h-full overflow-y-auto scrollbar-hide"
          >
            <Outlet />
          </motion.div>
        )}
      </main>
      {!isChildRoute && <Footer onBookTable={() => setModalOpen(true)} />}
      <MobileTabBar />
      <ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-5 z-50 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Return to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}