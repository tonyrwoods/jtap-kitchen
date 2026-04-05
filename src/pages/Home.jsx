import HeroSection from "../components/HeroSection";
import GallerySection from "../components/GallerySection";
import MenuHighlights from "../components/MenuHighlights";
import AboutSection from "../components/AboutSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ReservationSection from "../components/ReservationSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MenuHighlights />
      <AboutSection />
      <GallerySection />
      <TestimonialsSection />
      <ReservationSection />
    </>
  );
}