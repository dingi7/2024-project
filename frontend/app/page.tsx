import OverviewSection from "../components/sections/OverviewSection";
import HeroSection from "../components/sections/HeroSection";
import ContestSection from "../components/sections/ContestSection";

export default function Home() {
  return (
    <div>
        <HeroSection />
        <OverviewSection />
        <ContestSection />
      {/* <TestimonialsSection /> */}
    </div>
  );
}
