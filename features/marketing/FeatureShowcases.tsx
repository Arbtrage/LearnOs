import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import { OnboardingChatMock, RoadmapMock } from "@/features/marketing/components/OnboardingChatMock";
import { PracticeMock, RevisionMock } from "@/features/marketing/components/PracticeMock";
import { AnalyticsMock } from "@/features/marketing/components/AnalyticsMock";
import { WorkspaceHeroMock } from "@/features/marketing/components/WorkspaceHeroMock";
import { marketing } from "@/constants/design";
import { cn } from "@/lib/utils";

type ShowcaseItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  artifact: React.ReactNode;
  reverse?: boolean;
};

const SHOWCASES: ShowcaseItem[] = [
  {
    id: "onboarding",
    eyebrow: "AI onboarding",
    title: "Tell LearnOS your goal — it calibrates the rest",
    description:
      "Create a project and go through a turn-by-turn interview. LearnOS learns your exam date, weekly hours, and priorities before generating anything.",
    bullets: [
      "Structured interview, not a blank prompt",
      "Blueprint generated from your answers",
      "Workspace ready in minutes",
    ],
    artifact: (
      <ProductFrame url="learnos.app / onboarding">
        <OnboardingChatMock />
      </ProductFrame>
    ),
  },
  {
    id: "roadmap",
    eyebrow: "Adaptive roadmap",
    title: "Stages, milestones, and topics — sequenced for you",
    description:
      "Your roadmap breaks the syllabus into stages with clear milestones. Topics unlock as you progress, weighted by exam importance.",
    bullets: [
      "Multi-stage curriculum",
      "Milestone tracking",
      "Topic dependencies respected",
    ],
    artifact: (
      <ProductFrame url="learnos.app / roadmap">
        <RoadmapMock />
      </ProductFrame>
    ),
    reverse: true,
  },
  {
    id: "today",
    eyebrow: "Daily engine",
    title: "Wake up to a plan ranked for today",
    description:
      "Every morning, Today surfaces the tasks that matter most — based on progress, confidence, revision due dates, and exam weight.",
    bullets: [
      "Timeline view with focus sessions",
      "Priority-ranked tasks",
      "Adaptive rescheduling",
    ],
    artifact: (
      <ProductFrame url="learnos.app / today">
        <WorkspaceHeroMock />
      </ProductFrame>
    ),
  },
  {
    id: "practice",
    eyebrow: "Practice & mocks",
    title: "Drill weak topics and simulate exam day",
    description:
      "Run practice sets on specific topics, review mistakes, and take timed mock exams with readiness scoring so you know where you stand.",
    bullets: [
      "Topic-scoped practice sets",
      "Mistake tracking",
      "Mock exams with readiness score",
    ],
    artifact: (
      <ProductFrame url="learnos.app / practice">
        <PracticeMock />
      </ProductFrame>
    ),
    reverse: true,
  },
  {
    id: "revision",
    eyebrow: "Spaced revision",
    title: "Turn wrong answers into cards that stick",
    description:
      "Revision queue uses spaced repetition on concepts you miss. Review flashcards daily — even offline on mobile via PWA.",
    bullets: [
      "Auto-generated from mistakes",
      "Due-date scheduling",
      "Offline-ready revision",
    ],
    artifact: (
      <ProductFrame url="learnos.app / revision">
        <RevisionMock />
      </ProductFrame>
    ),
  },
  {
    id: "analytics",
    eyebrow: "Analytics",
    title: "Know if you're on track before exam day",
    description:
      "Learning health, topic accuracy heatmaps, study time trends, and projected readiness — so you can adjust before it's too late.",
    bullets: [
      "Readiness trend charts",
      "Topic accuracy heatmap",
      "Exam countdown alerts",
    ],
    artifact: (
      <ProductFrame url="learnos.app / analytics">
        <AnalyticsMock />
      </ProductFrame>
    ),
    reverse: true,
  },
];

export function FeatureShowcases() {
  return (
    <section id="features" className={marketing.section}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Features</p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          Every surface you need to <span className="gradient-text">learn deeply</span>
        </h2>
      </div>
      <div className="mt-16 space-y-24">
        {SHOWCASES.map((item) => (
          <div
            key={item.id}
            className={cn(marketing.showcase, item.reverse && "lg:[&>*:first-child]:order-2")}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                {item.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 text-muted-foreground">{item.description}</p>
              <ul className="mt-6 space-y-2">
                {item.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>{item.artifact}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
