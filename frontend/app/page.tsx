import Image from "next/image";
import Header from "./Components/Header";
import OverviewSection from "./Components/OverviewSection";
import HeroSection from "./Components/HeroSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <OverviewSection />
      </main>
    </main>
  );
}
