import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import ReservationModal from "./ReservationModal";
import PullToRefresh from "./PullToRefresh";

const TAB_ROUTES = ["/", "/menu", "/gift-cards", "/events"];

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

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
            className="h-full overflow-y-auto scrollbar-hide"
          >
            <Outlet />
          </motion.div>
        )}
      </main>
      {!isChildRoute && <Footer />}
      <MobileTabBar />
      <ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}