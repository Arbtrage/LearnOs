"use client";

import { AnimatePresence, motion } from "framer-motion";
import { OnboardingProgress } from "@/features/onboarding/OnboardingProgress";
import { stepTransition, stepTransitionReduced } from "@/lib/utils/motion";
import { cn } from "@/lib/utils";

type TypeformShellProps = {
  projectTitle: string;
  currentStep: number;
  totalSteps: number;
  questionKey?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  reducedMotion?: boolean;
  className?: string;
};

export function TypeformShell({
  projectTitle,
  currentStep,
  totalSteps,
  questionKey,
  title,
  subtitle,
  children,
  reducedMotion = false,
  className,
}: TypeformShellProps) {
  const transition = reducedMotion ? stepTransitionReduced : stepTransition;

  return (
    <div className={cn("flex min-h-[calc(100vh-4rem)] flex-col", className)}>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-4">
          <p className="text-sm text-muted-foreground">{projectTitle}</p>
          <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={questionKey ?? title} {...transition} className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>
              ) : null}
            </div>
            <div>{children}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
