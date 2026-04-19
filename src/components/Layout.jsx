import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import ReservationModal from "./ReservationModal";

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
  const isChildRoute = location.pathname !== "/" && !location.pathname.startsWith("/gift-cards") && !location.pathname.startsWith("/events");

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <Navbar onBookTable={() => setModalOpen(true)} />
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <Outlet />
      </main>
      {!isChildRoute && <Footer />}
      <MobileTabBar />
      <ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}