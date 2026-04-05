import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ReservationModal from "./ReservationModal";

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onBookTable={() => setModalOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ReservationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}