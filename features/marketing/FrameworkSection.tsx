"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck2,
  LineChart,
  Repeat2,
  Target,
  type LucideIcon,
} from "lucide-react";
import { ProductFrame } from "@/features/marketing/components/ProductFrame";
import { LoopDiagram } from "@/features/marketing/components/LoopDiagram";
import { TodayTimelineMock } from "@/features/marketing/components/TodayTimelineMock";
import { RoadmapMock } from "@/features/marketing/components/OnboardingChatMock";
import { PracticeMock, RevisionMock } from "@/features/marketing/components/PracticeMock";
import { AnalyticsMock } from "@/features/marketing/components/AnalyticsMock";
import { marketing } from "@/constants/design";
import { cn } from "@/lib/utils";

type FrameworkStep = {
  id: string;
  label: string;
  icon: LucideIcon;
  title: string;
  body: string;
  url: string;
  mock: React.ReactNode;
};

const STEPS: FrameworkStep[] = [
  {
    id: "plan",
    label: "Plan",
    icon: CalendarCheck2,
    title: "A blueprint built from your interview",
    body: "Your exam date, weekly hours, and constraints become milestones, a daily study budget, and a plan ranked for each morning — not a generic syllabus.",
    url: "learnos.app / today",
    mock: (
      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">Today · ranked for you</p>
        <TodayTimelineMock />
      </div>
    ),
  },
  {
    id: "learn",
    label: "Learn",
    icon: BookOpen,
    title: "A dependency-ordered roadmap",
    body: "Stages unlock topic by topic, each with observable objectives, generated lessons, and verified resources — so you always know what comes next and why.",
    url: "learnos.app / roadmap",
    mock: <RoadmapMock />,
  },
  {
    id: "practice",
    label: "Practice",
    icon: Target,
    title: "Active recall on your weak spots",
    body: "Topic drills and timed mocks test what you just learned. Every wrong answer is captured — it becomes fuel for revision instead of disappearing.",
    url: "learnos.app / practice",
    mock: <PracticeMock />,
  },
  {
    id: "master",
    label: "Master",
    icon: Repeat2,
    title: "Spaced repetition that fights forgetting",
    body: "Mistakes turn into flashcards on an SM-2 schedule, resurfacing right before you'd forget them. Rate each card and the interval adapts.",
    url: "learnos.app / revision",
    mock: <RevisionMock />,
  },
  {
    id: "reflect",
    label: "Reflect",
    icon: LineChart,
    title: "A readiness score you can trust",
    body: "Progress blends study sessions, practice accuracy, and revision strength into one honest number — so you adjust weeks before exam day, not after.",
    url: "learnos.app / analytics",
    mock: <AnalyticsMock />,
  },
];

export function FrameworkSection() {
  const [activeId, setActiveId] = React.useState(STEPS[0].id);
  const reduceMotion = useReducedMotion();
  const active = STEPS.find((step) => step.id === activeId) ?? STEPS[0];

  return (
    <section id="method" className={marketing.section}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          The LearnOS method
        </p>
        <h2 className={`mt-3 ${marketing.sectionTitle}`}>
          A mastery loop, not a <span className="gradient-text">content dump</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Five stages, repeated daily, each feeding the next. Wrong answers become
          flashcards, sessions update your readiness, and tomorrow&apos;s plan reacts
          to today.
        </p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="space-y-2" role="tablist" aria-label="Learning method stages">
          {STEPS.map((step, i) => {
            const isActive = step.id === activeId;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(step.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card/50 hover:border-primary/25 hover:bg-card",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg border",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] text-primary/50">
                    0{i + 1}
                  </span>
                  <span className={cn("text-sm font-semibold", !isActive && "text-foreground/80")}>
                    {step.label}
                  </span>
                  <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                    {step.title}
                  </span>
                </span>
                <AnimatePresence initial={false}>
                  {isActive ? (
                    <motion.span
                      className="block overflow-hidden"
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <span className="block pt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </span>
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-24">
          <ProductFrame url={active.url}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="min-h-[280px]"
              >
                {active.mock}
              </motion.div>
            </AnimatePresence>
          </ProductFrame>
        </div>
      </div>

      <div className="mt-16">
        <LoopDiagram
          nodes={STEPS.map(({ id, label, icon }) => ({ id, label, icon }))}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </div>
    </section>
  );
}
