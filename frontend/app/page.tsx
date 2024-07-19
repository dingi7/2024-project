import Image from "next/image";
import Header from "../components/Header";
import OverviewSection from "../components/sections/OverviewSection";
import HeroSection from "../components/sections/HeroSection";
import ContestSection from "../components/sections/ContestSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <OverviewSection />
        <ContestSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </main>
  );
}
