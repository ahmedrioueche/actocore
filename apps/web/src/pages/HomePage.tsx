import { ArchitectureSection } from '@/components/home/ArchitectureSection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';
import { HeroSection } from '@/components/home/HeroSection';
import { PlatformCapabilitiesSection } from '@/components/home/PlatformCapabilitiesSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { TrustedBySection } from '@/components/home/TrustedBySection';
import { usePageMeta } from '@/hooks/usePageMeta';

export function HomePage() {
  usePageMeta('home');

  return (
    <div className="mesh-gradient">
      <HeroSection />
      <TrustedBySection />
      <PlatformCapabilitiesSection />
      <ArchitectureSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </div>
  );
}
