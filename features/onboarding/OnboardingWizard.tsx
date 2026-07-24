"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressLoader } from "@/components/common/ProgressLoader";
import { TypeformShell } from "@/features/onboarding/TypeformShell";
import { QuestionRenderer } from "@/features/onboarding/QuestionRenderer";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { InterviewAnswerValue, OnboardingState } from "@/types/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OnboardingWizardProps = {
  initialState: OnboardingState;
};

const BOOTSTRAP_MESSAGES = [
  "Reading your project goal...",
  "Reviewing your past projects...",
  "Preparing your personalized questions...",
  "Almost ready...",
];

const COMPLETING_MESSAGES = [
  "Wrapping up your interview...",
  "Saving your learner profile...",
  "Preparing your workspace...",
];

export function OnboardingWizard({ initialState }: OnboardingWizardProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState(initialState);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const bootstrapInFlightRef = useRef(false);

  useEffect(() => {
    if (state.currentQuestion || state.isComplete) {
      return;
    }

    if (bootstrapInFlightRef.current) {
      return;
    }

    let cancelled = false;
    bootstrapInFlightRef.current = true;

    async function bootstrapInterview() {
      setIsBootstrapping(true);
      setError(null);

      try {
        const response = await fetch(`/api/onboarding/${state.conversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "bootstrap" }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to start interview");
        }

        const nextState = (await response.json()) as OnboardingState;
        if (!cancelled) {
          setState(nextState);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        bootstrapInFlightRef.current = false;
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapInterview();

    return () => {
      cancelled = true;
      bootstrapInFlightRef.current = false;
    };
  }, [
    state.conversationId,
    state.currentQuestion,
    state.isComplete,
    bootstrapAttempt,
  ]);

  const totalSteps = Math.max(state.totalQuestions, 1);
  const currentStep = Math.min(state.answerCount + 1, totalSteps);

  const submitAnswer = async (answer: InterviewAnswerValue) => {
    if (!state.currentQuestion) return;

    setError(null);

    try {
      const response = await fetch(`/api/onboarding/${state.conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          questionKey: state.currentQuestion.key,
          answer,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to submit answer");
      }

      const nextState = (await response.json()) as OnboardingState;

      if (nextState.isComplete) {
        setIsCompleting(true);
        router.push(`/projects/${nextState.projectSlug}`);
        router.refresh();
        return;
      }

      setState(nextState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (state.isComplete && !isCompleting) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Onboarding complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{state.summary}</p>
            <Button onClick={() => router.push(`/projects/${state.projectSlug}`)}>
              Open workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <TypeformShell
        projectTitle={state.projectTitle}
        currentStep={totalSteps}
        totalSteps={totalSteps}
        questionKey="completing"
        title="You're all set"
        subtitle="We're finishing up and opening your workspace."
        reducedMotion={reducedMotion}
      >
        <ProgressLoader messages={COMPLETING_MESSAGES} />
      </TypeformShell>
    );
  }

  if (isBootstrapping || !state.currentQuestion) {
    return (
      <TypeformShell
        projectTitle={state.projectTitle}
        currentStep={1}
        totalSteps={totalSteps}
        questionKey="loading-start"
        title="Getting started"
        subtitle="We're preparing your personalized interview."
        reducedMotion={reducedMotion}
      >
        <ProgressLoader messages={BOOTSTRAP_MESSAGES} />
        {error ? (
          <div className="mt-4 space-y-3 text-center">
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setBootstrapAttempt((count) => count + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}
      </TypeformShell>
    );
  }

  const introMessage = state.messages.find((m) => m.role === "assistant")?.content;

  return (
    <TypeformShell
      projectTitle={state.projectTitle}
      currentStep={currentStep}
      totalSteps={totalSteps}
      questionKey={state.currentQuestion.key}
      title={state.currentQuestion.label}
      subtitle={
        state.answerCount === 0 && introMessage ? introMessage : undefined
      }
      reducedMotion={reducedMotion}
    >
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <QuestionRenderer
        key={state.currentQuestion.key}
        question={state.currentQuestion}
        onSubmit={submitAnswer}
        isSubmitting={false}
        variant="typeform"
      />
    </TypeformShell>
  );
}
