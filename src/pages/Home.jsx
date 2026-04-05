import HeroSection from "../components/HeroSection";
import SmartKitchenSection from "../components/SmartKitchenSection";
import GallerySection from "../components/GallerySection";
import InstagramSection from "../components/InstagramSection";
import TeamSection from "../components/TeamSection";
import ChefsSpotlight from "../components/ChefsSpotlight";
import MenuSection from "../components/MenuSection";
import AboutSection from "../components/AboutSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ReservationSection from "../components/ReservationSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SmartKitchenSection />
      <MenuSection />
      <AboutSection />
      <TeamSection />
      <ChefsSpotlight />
      <GallerySection />
      <InstagramSection />
      <TestimonialsSection />
      <ReservationSection />
    </>
  );
}