"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreateProjectStepChoose } from "@/features/projects/create/CreateProjectStepChoose";
import { CreateProjectStepReview } from "@/features/projects/create/CreateProjectStepReview";
import {
  isDraftValid,
  type CreateProjectStep,
  type ProjectDraft,
} from "@/features/projects/create/types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  stepTransition,
  stepTransitionReduced,
} from "@/lib/utils/motion";
import { cn } from "@/lib/utils";

export function CreateProjectPage() {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<CreateProjectStep>("choose");
  const [draft, setDraft] = useState<ProjectDraft | null>(null);

  const transition = reducedMotion ? stepTransitionReduced : stepTransition;

  const handleContinue = useCallback(() => {
    if (isDraftValid(draft)) {
      setStep("review");
    }
  }, [draft]);

  const handleBack = useCallback(() => {
    setStep("choose");
  }, []);

  const accentGlow = draft?.accentColor ?? "#6366f1";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${accentGlow}55 0%, transparent 70%)`,
          }}
        />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {step === "choose" ? (
          <motion.div
            key="choose"
            className={cn("flex min-h-[calc(100vh-4rem)] flex-1 flex-col")}
            {...transition}
          >
            <CreateProjectStepChoose
              draft={draft}
              onDraftChange={setDraft}
              onContinue={handleContinue}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        ) : draft ? (
          <motion.div
            key="review"
            className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col"
            {...transition}
          >
            <CreateProjectStepReview
              draft={draft}
              onDraftChange={setDraft}
              onBack={handleBack}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
