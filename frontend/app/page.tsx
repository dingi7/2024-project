import Image from "next/image";
import OverviewSection from "../components/sections/OverviewSection";
import HeroSection from "../components/sections/HeroSection";
import ContestSection from "../components/sections/ContestSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
      <div>
        <HeroSection />
        <OverviewSection />
        <ContestSection />
        <TestimonialsSection />
      </div>
  );
}
