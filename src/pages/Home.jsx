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
import FaqSection from "../components/FaqSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ChefHighlights from "../components/ChefHighlights.jsx";
import AvailabilityChecker from "../components/AvailabilityChecker";
import WeekendAvailability from "../components/WeekendAvailability";
import ReservationModal from "../components/ReservationModal";
import UpcomingEventsStrip from "../components/UpcomingEventsStrip";
import StickyReserveBar from "../components/StickyReserveBar";
import LoyaltyTeaserBanner from "../components/LoyaltyTeaserBanner";
import EventCenterTeaser from "../components/EventCenterTeaser";
import GiftCardTeaser from "../components/GiftCardTeaser";
import ValuePropsStrip from "../components/ValuePropsStrip";
import StatsBar from "../components/StatsBar";
import NewsletterCTA from "../components/NewsletterCTA";

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
      <ValuePropsStrip />
      <StatsBar />
      <WeekendAvailability onBook={handleBook} />
      <AvailabilityChecker onBook={handleBook} />
      <ChefHighlights />
      <UpcomingEventsStrip />
      <MenuSection />
      <AboutSection />
      <EventCenterTeaser />
      <FeaturedPress />
      <TeamSection />
      <TestimonialsSection />
      <GallerySectionCMS />
      <InstagramSection />
      <NewsletterCTA />
      <LoyaltyTeaserBanner />
      <GiftCardTeaser />
      <FaqSection />
      <ReservationModal open={modalOpen} onClose={() => { setModalOpen(false); setPrefill(null); }} prefill={prefill} />
      <StickyReserveBar onBook={() => setModalOpen(true)} />
    </>
  );
}