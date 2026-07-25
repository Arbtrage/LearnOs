import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import {
  CreateProjectMock,
  OnboardingChatMock,
  RoadmapMock,
} from "@/features/marketing/components/OnboardingChatMock";
import { DailyLoopMock } from "@/features/marketing/components/SageChatMock";
import { marketing } from "@/constants/design";

const STEPS = [
  {
    n: "01",
    title: "Set your goal",
    body: "Create a project with your exam or skill target, timeline, and weekly study hours.",
    artifact: (
      <ProductFrame url="learnos.app / projects / new">
        <CreateProjectMock />
      </ProductFrame>
    ),
  },
  {
    n: "02",
    title: "AI interview",
    body: "Answer a few calibrated questions so LearnOS understands your context and constraints.",
    artifact: (
      <ProductFrame url="learnos.app / onboarding">
        <OnboardingChatMock />
      </ProductFrame>
    ),
  },
  {
    n: "03",
    title: "Get your roadmap",
    body: "Stages, topics, resources, and sidebar — generated and ready in minutes.",
    artifact: (
      <ProductFrame url="learnos.app / roadmap">
        <RoadmapMock />
      </ProductFrame>
    ),
  },
  {
    n: "04",
    title: "Run the daily loop",
    body: "Today plans your tasks. Focus, practice, revise — progress updates automatically.",
    artifact: (
      <ProductFrame url="learnos.app / today">
        <DailyLoopMock />
      </ProductFrame>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className={`${marketing.section} bg-surface/30`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">How it works</p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          From goal to daily progress in <span className="gradient-text">four steps</span>
        </h2>
      </div>
      <div className="mt-16 space-y-16">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <p className="font-mono text-3xl font-bold text-primary/30">{step.n}</p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-muted-foreground">{step.body}</p>
            </div>
            <div>{step.artifact}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
