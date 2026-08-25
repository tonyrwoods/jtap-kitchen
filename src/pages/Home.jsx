import { useState } from "react";
import useSeoMeta from "../hooks/useSeoMeta";
import HeroSection from "../components/HeroSection";
import GrandOpeningCountdown from "../components/GrandOpeningCountdown";
import GallerySectionCMS from "../components/GallerySectionCMS";
import InstagramSection from "../components/InstagramSection";
import TeamSection from "../components/TeamSection";
import MenuSection from "../components/MenuSection";
import AboutSection from "../components/AboutSection";
import FeaturedPress from "../components/FeaturedPress";
import TestimonialsSection from "../components/TestimonialsSection";
import ChefHighlights from "../components/ChefHighlights.jsx";
import AvailabilityChecker from "../components/AvailabilityChecker";
import WeekendAvailability from "../components/WeekendAvailability";
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
      <GrandOpeningCountdown />
      <WeekendAvailability onBook={handleBook} />
      <AvailabilityChecker onBook={handleBook} />
      <ChefHighlights />
      <MenuSection />
      <AboutSection />
      <FeaturedPress />
      <TeamSection />
      <GallerySectionCMS />
      <InstagramSection />
      <TestimonialsSection />
      <ReservationModal open={modalOpen} onClose={() => { setModalOpen(false); setPrefill(null); }} prefill={prefill} />
    </>
  );
}