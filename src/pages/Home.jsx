import useSeoMeta from "../hooks/useSeoMeta";
import HeroSection from "../components/HeroSection";
import GallerySection from "../components/GallerySection";
import InstagramSection from "../components/InstagramSection";
import TeamSection from "../components/TeamSection";
import MenuSection from "../components/MenuSection";
import AboutSection from "../components/AboutSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ChefHighlights from "../components/ChefHighlights";

export default function Home() {
  useSeoMeta("home");
  return (
    <>
      <HeroSection />
      <ChefHighlights />
      <MenuSection />
      <AboutSection />
      <TeamSection />
      <GallerySection />
      <InstagramSection />
      <TestimonialsSection />
    </>
  );
}