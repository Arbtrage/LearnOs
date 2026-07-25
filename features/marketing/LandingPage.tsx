import { CtaSection, MarketingFooter } from "@/features/marketing/CtaSection";
import { FaqSection } from "@/features/marketing/FaqSection";
import { FeatureShowcases } from "@/features/marketing/FeatureShowcases";
import { HeroSection } from "@/features/marketing/HeroSection";
import { HowItWorks } from "@/features/marketing/HowItWorks";
import { LearningLoopSection } from "@/features/marketing/LearningLoopSection";
import { LogosStrip } from "@/features/marketing/LogosStrip";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import { SageSpotlightSection } from "@/features/marketing/SageSpotlightSection";
import { UseCasesSection } from "@/features/marketing/UseCasesSection";
import { WorkspacePreviewSection } from "@/features/marketing/WorkspacePreviewSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <HeroSection />
      <LogosStrip />
      <LearningLoopSection />
      <FeatureShowcases />
      <WorkspacePreviewSection />
      <SageSpotlightSection />
      <HowItWorks />
      <UseCasesSection />
      <FaqSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  );
}
