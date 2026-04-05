import HeroSection from "../components/HeroSection";
import GallerySection from "../components/GallerySection";
import InstagramSection from "../components/InstagramSection";
import TeamSection from "../components/TeamSection";
import MenuSection from "../components/MenuSection";
import AboutSection from "../components/AboutSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ReservationSection from "../components/ReservationSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MenuSection />
      <AboutSection />
      <TeamSection />
      <GallerySection />
      <InstagramSection />
      <TestimonialsSection />
      <ReservationSection />
    </>
  );
}