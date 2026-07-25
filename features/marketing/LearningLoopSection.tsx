import {
  BarChart3,
  BookOpen,
  RefreshCw,
  Target,
  Zap,
} from "lucide-react";
import { marketing, semantic } from "@/constants/design";
import { cn } from "@/lib/utils";

const LOOP_STEPS = [
  {
    icon: Target,
    label: "Plan",
    outcome: "Today + roadmap from your goal and timeline",
    routes: "Overview · Today",
  },
  {
    icon: BookOpen,
    label: "Learn",
    outcome: "Topics, resources, and staged milestones",
    routes: "Roadmap · Topics · Resources",
  },
  {
    icon: Zap,
    label: "Practice",
    outcome: "Drills and timed sets on weak areas",
    routes: "Practice",
  },
  {
    icon: RefreshCw,
    label: "Master",
    outcome: "Spaced revision, notes, and mock exams",
    routes: "Revision · Notes · Exam",
  },
  {
    icon: BarChart3,
    label: "Reflect",
    outcome: "Readiness trends and topic heatmaps",
    routes: "Analytics",
  },
];

export function LearningLoopSection() {
  return (
    <section className={`${marketing.section} bg-surface/30`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">The loop</p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          One system for your entire <span className="gradient-text">learning journey</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          LearnOS mirrors how serious learners actually study — not a single feature, but a connected
          workspace that adapts every day.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {LOOP_STEPS.map((step, i) => (
          <div
            key={step.label}
            className="relative rounded-xl border border-border/80 bg-card p-5"
          >
            {i < LOOP_STEPS.length - 1 ? (
              <span
                className="absolute -right-2 top-1/2 hidden h-px w-4 bg-border lg:block"
                aria-hidden="true"
              />
            ) : null}
            <div className={semantic.iconBoxPrimary}>
              <step.icon className="size-5" />
            </div>
            <p className="mt-4 font-semibold">{step.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">{step.outcome}</p>
            <p className={cn("mt-3 text-[10px] uppercase tracking-wider text-primary/70")}>
              {step.routes}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
