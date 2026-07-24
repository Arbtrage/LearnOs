"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectPreviewCard } from "@/features/projects/create/ProjectPreviewCard";
import type { ProjectDraft } from "@/features/projects/create/types";
import { createProjectAction } from "@/features/projects/actions";

type CreateProjectStepReviewProps = {
  draft: ProjectDraft;
  onDraftChange: (draft: ProjectDraft) => void;
  onBack: () => void;
  reducedMotion?: boolean;
};

export function CreateProjectStepReview({
  draft,
  onDraftChange,
  onBack,
  reducedMotion = false,
}: CreateProjectStepReviewProps) {
  const [state, formAction, pending] = useActionState(createProjectAction, {});
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
          >
            Make it yours
          </h1>
          <p className="text-muted-foreground">
            Review your project details before starting the AI onboarding
            interview.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <ProjectPreviewCard
              draft={draft}
              isLoading={pending}
              reducedMotion={reducedMotion}
            />
          </div>

          <div className="order-1 space-y-6 lg:order-2">
            <form action={formAction} className="space-y-5">
              {state.error ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              ) : null}

              <input type="hidden" name="title" value={draft.title} />
              <input type="hidden" name="goal" value={draft.goal} />
              {draft.category ? (
                <input type="hidden" name="category" value={draft.category} />
              ) : null}
              {draft.icon ? (
                <input type="hidden" name="icon" value={draft.icon} />
              ) : null}
              {draft.accentColor ? (
                <input type="hidden" name="accentColor" value={draft.accentColor} />
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="review-title">Project title</Label>
                <Input
                  id="review-title"
                  value={draft.title}
                  onChange={(e) =>
                    onDraftChange({ ...draft, title: e.target.value })
                  }
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-goal">Learning goal</Label>
                <textarea
                  id="review-goal"
                  value={draft.goal}
                  onChange={(e) =>
                    onDraftChange({ ...draft, goal: e.target.value })
                  }
                  required
                  className="flex min-h-32 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {draft.category ? (
                <div className="space-y-2">
                  <Label htmlFor="review-category">Category</Label>
                  <Input
                    id="review-category"
                    value={draft.category}
                    readOnly
                    className="h-11 bg-muted/50"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={pending}
                  className="gap-1.5"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending || !draft.title.trim() || !draft.goal.trim()}
                  className="flex-1 sm:flex-none"
                >
                  {pending ? "Creating..." : "Start AI onboarding"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
