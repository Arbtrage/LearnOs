import { AiPlatformSection } from "@/features/marketing/AiPlatformSection";
import { CtaSection, MarketingFooter } from "@/features/marketing/CtaSection";
import { FaqSection } from "@/features/marketing/FaqSection";
import { FeatureShowcases } from "@/features/marketing/FeatureShowcases";
import { FrameworkSection } from "@/features/marketing/FrameworkSection";
import { HeroSection } from "@/features/marketing/HeroSection";
import { HowItWorks } from "@/features/marketing/HowItWorks";
import { LogosStrip } from "@/features/marketing/LogosStrip";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import { SageSpotlightSection } from "@/features/marketing/SageSpotlightSection";
import { UseCasesSection } from "@/features/marketing/UseCasesSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <HeroSection />
      <LogosStrip />
      <FrameworkSection />
      <HowItWorks />
      <AiPlatformSection />
      <FeatureShowcases />
      <SageSpotlightSection />
      <UseCasesSection />
      <FaqSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  );
}
