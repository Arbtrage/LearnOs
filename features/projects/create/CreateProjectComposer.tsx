"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppLogo } from "@/components/common/AppLogo";
import { ProgressLoader } from "@/components/common/ProgressLoader";
import { Button } from "@/components/ui/button";
import { createProjectFromIntent } from "@/features/projects/actions";
import { TemplateMarquee } from "@/features/projects/create/TemplateMarquee";
import { pageEnter, stepTransition, stepTransitionReduced } from "@/lib/utils/motion";

type CreateProjectComposerProps = {
  reducedMotion?: boolean;
};

const CREATING_MESSAGES = [
  "Understanding your learning goal...",
  "Crafting your project...",
  "Setting up your AI interview...",
  "Almost there...",
];

export function CreateProjectComposer({
  reducedMotion = false,
}: CreateProjectComposerProps) {
  const [intent, setIntent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transition = reducedMotion ? stepTransitionReduced : stepTransition;
  const HeroWrapper = reducedMotion ? "div" : motion.div;

  const handleContinue = useCallback(async () => {
    const trimmed = intent.trim();
    if (trimmed.length < 15 || isCreating) return;

    setIsCreating(true);
    setError(null);

    const result = await createProjectFromIntent(trimmed);
    if (result?.error) {
      setError(result.error);
      setIsCreating(false);
    }
  }, [intent, isCreating]);

  const handleTemplateSelect = (goal: string) => {
    setIntent(goal);
  };

  const canContinue = intent.trim().length >= 15 && !isCreating;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="creating"
            {...transition}
            className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6"
          >
            <ProgressLoader messages={CREATING_MESSAGES} />
          </motion.div>
        ) : (
          <HeroWrapper
            key="intent"
            {...(!reducedMotion && { ...pageEnter })}
            className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-12"
          >
            <div className="space-y-3 text-center">
              <div className="mx-auto flex justify-center">
                <AppLogo showText={false} size="md" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                What do you want to learn?
              </h1>
              <p className="text-muted-foreground">
                Describe your goal — we&apos;ll create your project and start the
                interview.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                autoFocus
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canContinue) {
                    e.preventDefault();
                    void handleContinue();
                  }
                }}
                placeholder="I want to pass the AWS Solutions Architect exam in 3 months while working full-time..."
                className="flex min-h-32 w-full rounded-2xl border border-input bg-background px-4 py-4 text-base leading-relaxed shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="What do you want to learn?"
              />
              <p className="text-xs text-muted-foreground">
                {intent.trim().length < 15
                  ? "Type at least 15 characters, then continue"
                  : "Press Continue to begin your AI interview"}
              </p>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
                Or pick a starting point
              </p>
              <TemplateMarquee onSelect={handleTemplateSelect} disabled={isCreating} />
            </div>
          </HeroWrapper>
        )}
      </AnimatePresence>

      {!isCreating ? (
        <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex max-w-3xl justify-end">
            <Button
              size="lg"
              onClick={() => void handleContinue()}
              disabled={!canContinue}
              className="min-w-36"
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
