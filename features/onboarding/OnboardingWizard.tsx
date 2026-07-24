"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/common/LoadingState";
import { WizardStep } from "@/components/common/WizardStep";
import { AIChat } from "@/features/ai/AIChat";
import { QuestionRenderer } from "@/features/onboarding/QuestionRenderer";
import type { InterviewAnswerValue, OnboardingState } from "@/types/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OnboardingWizardProps = {
  initialState: OnboardingState;
};

export function OnboardingWizard({ initialState }: OnboardingWizardProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 8;
  const currentStep = Math.min(state.answerCount + 1, totalSteps);

  const submitAnswer = useCallback(
    (answer: InterviewAnswerValue) => {
      if (!state.currentQuestion) return;

      startTransition(async () => {
        setError(null);
        try {
          const response = await fetch(
            `/api/onboarding/${state.conversationId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "answer",
                questionKey: state.currentQuestion!.key,
                answer,
              }),
            },
          );

          if (!response.ok) {
            const data = (await response.json()) as { error?: string };
            throw new Error(data.error ?? "Failed to submit answer");
          }

          const nextState = (await response.json()) as OnboardingState;

          if (nextState.isComplete) {
            router.push(`/projects/${nextState.projectSlug}`);
            router.refresh();
            return;
          }

          setState((prev) => ({
            ...nextState,
            messages: [...prev.messages, ...nextState.messages],
            answerCount: prev.answerCount + 1,
          }));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      });
    },
    [state.conversationId, state.currentQuestion, router],
  );

  if (state.isComplete) {
    return (
      <Card>
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
    );
  }

  return (
    <div className="space-y-6">
      <WizardStep
        currentStep={currentStep}
        totalSteps={totalSteps}
        label={`Interview for ${state.projectTitle}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <AIChat messages={state.messages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your answer</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {state.currentQuestion ? (
              <QuestionRenderer
                key={state.currentQuestion.key}
                question={state.currentQuestion}
                onSubmit={submitAnswer}
                isSubmitting={isPending}
              />
            ) : isPending ? (
              <LoadingState label="Preparing next question..." />
            ) : (
              <LoadingState label="Starting interview..." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
