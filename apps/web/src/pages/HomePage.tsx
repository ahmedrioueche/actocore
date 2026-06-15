import { ArchitectureSection } from "@/components/home/ArchitectureSection";
import { DemoVideoSection } from "@/components/home/DemoVideoSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PlatformCapabilitiesSection } from "@/components/home/PlatformCapabilitiesSection";
import { PlaygroundSection } from "@/components/home/PlaygroundSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustedBySection } from "@/components/home/TrustedBySection";
import { usePageMeta } from "@/hooks/usePageMeta";

export function HomePage() {
  usePageMeta("home");

  return (
    <div className="mesh-gradient">
      <HeroSection />
      <TrustedBySection />
      <DemoVideoSection />
      <PlaygroundSection />
      <HowItWorksSection />
      <PlatformCapabilitiesSection />
      <ArchitectureSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </div>
  );
}
