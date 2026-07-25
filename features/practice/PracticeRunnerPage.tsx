"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { buttonVariants } from "@/components/ui/button";
import { PracticeRunner } from "@/features/practice/PracticeRunner";
import type { PracticeAttemptDto, QuestionReviewDto } from "@/types/practice";

type PracticeRunnerPageProps = {
  projectSlug: string;
  attemptId: string;
};

export function PracticeRunnerPage({ projectSlug, attemptId }: PracticeRunnerPageProps) {
  const queryClient = useQueryClient();
  const [completed, setCompleted] = React.useState(false);
  const [score, setScore] = React.useState<{
    scorePercent: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);
  const [review, setReview] = React.useState<QuestionReviewDto[]>([]);

  const attemptQuery = useQuery({
    queryKey: ["practice-attempt", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/practice/attempts/${attemptId}`);
      if (!res.ok) throw new Error("Failed to load attempt");
      const data = (await res.json()) as { attempt: PracticeAttemptDto };
      return data.attempt;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      questionId,
      userAnswer,
    }: {
      questionId: string;
      userAnswer: unknown;
    }) => {
      const res = await fetch(`/api/practice/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, userAnswer }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return res.json() as Promise<{ isCorrect: boolean }>;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/practice/attempts/${attemptId}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to complete attempt");
      return res.json() as Promise<{
        scorePercent: number;
        correctCount: number;
        totalQuestions: number;
      }>;
    },
    onSuccess: async (result) => {
      setScore(result);
      setCompleted(true);
      const reviewRes = await fetch(`/api/practice/attempts/${attemptId}/review`);
      if (reviewRes.ok) {
        const data = (await reviewRes.json()) as { review: QuestionReviewDto[] };
        setReview(data.review);
      }
      void queryClient.invalidateQueries({ queryKey: ["practice"] });
      void queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });

  if (attemptQuery.isLoading) {
    return <LoadingState label="Loading practice session..." />;
  }

  if (!attemptQuery.data) {
    return (
      <p className="text-destructive" role="alert">
        Practice session not found.
      </p>
    );
  }

  const attempt = attemptQuery.data;
  const isCompleted = completed || Boolean(attempt.endedAt);
  const displayScore =
    score ??
    (attempt.endedAt
      ? {
          scorePercent: attempt.scorePercent ?? 0,
          correctCount: attempt.correctCount,
          totalQuestions: attempt.totalQuestions,
        }
      : null);

  return (
    <div className="space-y-6">
      <Link
        href={isCompleted ? `/projects/${projectSlug}/practice` : `/projects/${projectSlug}/today`}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" />
        {isCompleted ? "Back to practice" : "Back to today"}
      </Link>

      <PracticeRunner
        attempt={attempt}
        completed={isCompleted}
        score={displayScore}
        review={review}
        onSubmitAnswer={async (questionId, userAnswer) =>
          submitMutation.mutateAsync({ questionId, userAnswer })
        }
        onComplete={async () => completeMutation.mutateAsync()}
      />

      {isCompleted ? (
        <div className="flex justify-center">
          <Link href={`/projects/${projectSlug}/practice`} className={buttonVariants()}>
            Done
          </Link>
        </div>
      ) : null}
    </div>
  );
}
