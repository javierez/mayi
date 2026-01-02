import Navbar from "~/components/navbar";
import { HeroSection } from "~/components/landing/HeroSection";
import { MemoryCalendar } from "~/components/memoria/MemoryCalendar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <MemoryCalendar />
    </div>
  );
}
