import { useState } from "react";
import useSeoMeta from "../hooks/useSeoMeta";
import HeroSection from "../components/HeroSection";
import GallerySection from "../components/GallerySection";
import InstagramSection from "../components/InstagramSection";
import TeamSection from "../components/TeamSection";
import MenuSection from "../components/MenuSection";
import AboutSection from "../components/AboutSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ChefHighlights from "../components/ChefHighlights.jsx";
import AvailabilityChecker from "../components/AvailabilityChecker";
import ReservationModal from "../components/ReservationModal";

export default function Home() {
  useSeoMeta("home");
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);

  const handleBook = (data) => {
    setPrefill(data);
    setModalOpen(true);
  };

  return (
    <>
      <HeroSection />
      <AvailabilityChecker onBook={handleBook} />
      <ChefHighlights />
      <MenuSection />
      <AboutSection />
      <TeamSection />
      <GallerySection />
      <InstagramSection />
      <TestimonialsSection />
      <ReservationModal open={modalOpen} onClose={() => { setModalOpen(false); setPrefill(null); }} prefill={prefill} />
    </>
  );
}