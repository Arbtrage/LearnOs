"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@/components/common/LoadingState";
import { MockExamRunner } from "@/features/exam/MockExamRunner";
import type { MockExamAttemptDto, MockExamReviewDto } from "@/types/mock-exam";

type MockExamRunnerPageProps = {
  attemptId: string;
};

export function MockExamRunnerPage({ attemptId }: MockExamRunnerPageProps) {
  const queryClient = useQueryClient();
  const [review, setReview] = React.useState<MockExamReviewDto | null>(null);

  const attemptQuery = useQuery({
    queryKey: ["mock-attempt", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/mock-exams/attempts/${attemptId}`);
      if (!res.ok) throw new Error("Failed to load attempt");
      return res.json() as Promise<MockExamAttemptDto>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      questionId,
      userAnswer,
    }: {
      questionId: string;
      userAnswer: unknown;
    }) => {
      const res = await fetch(`/api/mock-exams/attempts/${attemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, userAnswer }),
      });
      if (!res.ok) throw new Error("Failed to save answer");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/mock-exams/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json() as Promise<MockExamReviewDto>;
    },
    onSuccess: (data) => {
      setReview(data);
      void queryClient.invalidateQueries({ queryKey: ["readiness"] });
    },
  });

  if (attemptQuery.isLoading) return <LoadingState label="Loading mock exam..." />;
  if (attemptQuery.error || !attemptQuery.data) {
    return <p className="p-8 text-center text-muted-foreground">Mock exam not found.</p>;
  }

  return (
    <MockExamRunner
      attempt={attemptQuery.data}
      review={review}
      onSaveAnswer={async (questionId, userAnswer) => {
        await saveMutation.mutateAsync({ questionId, userAnswer });
      }}
      onSubmit={async () => submitMutation.mutateAsync()}
    />
  );
}
