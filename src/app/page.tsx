import Navbar from "~/components/navbar";
import { HeroSection } from "~/components/landing/HeroSection";
import { FeaturesGrid } from "~/components/landing/FeaturesGrid";
// import { IntegrationsSection } from "~/components/landing/IntegrationsSection";
// import { FutureFeatures } from "~/components/landing/FutureFeatures";
import { FutureFeaturesLeaderboard } from "~/components/landing/FutureFeaturesLeaderboard";
import { TestimonialsSection } from "~/components/landing/TestimonialsSection";
import { CTASection } from "~/components/landing/CTASection";
import { Footer } from "~/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesGrid />
      <FutureFeaturesLeaderboard />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
