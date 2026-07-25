"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { McqOptions } from "@/features/practice/McqOptions";
import { PracticeProgressBar } from "@/features/practice/PracticeProgressBar";
import { ShortAnswerInput } from "@/features/practice/ShortAnswerInput";
import type { PracticeAttemptDto, QuestionReviewDto } from "@/types/practice";

type PracticeRunnerProps = {
  attempt: PracticeAttemptDto;
  onSubmitAnswer: (questionId: string, userAnswer: unknown) => Promise<{ isCorrect: boolean }>;
  onComplete: () => Promise<{ scorePercent: number; correctCount: number; totalQuestions: number }>;
  review?: QuestionReviewDto[];
  completed?: boolean;
  score?: { scorePercent: number; correctCount: number; totalQuestions: number } | null;
};

export function PracticeRunner({
  attempt,
  onSubmitAnswer,
  onComplete,
  review,
  completed,
  score,
}: PracticeRunnerProps) {
  const [index, setIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = React.useState("");
  const [lastResult, setLastResult] = React.useState<boolean | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const question = attempt.questions[index];
  const isAnswered = question
    ? attempt.answeredQuestionIds.includes(question.id)
    : false;

  async function handleSubmit() {
    if (!question || submitting) return;
    setSubmitting(true);
    try {
      let userAnswer: unknown;
      if (question.type === "SHORT_ANSWER") {
        userAnswer = { text: shortAnswer.trim() };
      } else {
        userAnswer = { optionId: selectedOption };
      }
      const result = await onSubmitAnswer(question.id, userAnswer);
      setLastResult(result.isCorrect);
      if (index >= attempt.questions.length - 1) {
        await onComplete();
      } else {
        setTimeout(() => {
          setIndex((i) => i + 1);
          setSelectedOption(null);
          setShortAnswer("");
          setLastResult(null);
        }, 600);
      }
    } finally {
      setSubmitting(false);
    }
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!question || completed) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
        return;
      }
      if (question.type !== "SHORT_ANSWER" && question.options) {
        const num = Number(e.key);
        if (num >= 1 && num <= question.options.length) {
          setSelectedOption(question.options[num - 1]!.id);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (completed && score) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground">Practice complete</p>
          <p className="mt-2 text-4xl font-semibold">{score.scorePercent}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score.correctCount} of {score.totalQuestions} correct
          </p>
          {score.scorePercent >= 80 ? (
            <p className="mt-3 text-sm text-emerald-600">Great work — keep it up!</p>
          ) : score.scorePercent < 70 ? (
            <p className="mt-3 text-sm text-amber-600">
              Review the explanations below and try again.
            </p>
          ) : null}
        </div>
        {review && review.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-medium">Review incorrect answers</h2>
            {review.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <p className="font-medium">{item.prompt}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!question) {
    return <p className="text-sm text-muted-foreground">No questions in this attempt.</p>;
  }

  const canSubmit =
    question.type === "SHORT_ANSWER"
      ? shortAnswer.trim().length > 0
      : Boolean(selectedOption);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PracticeProgressBar current={index} total={attempt.totalQuestions} />
      <div className="rounded-xl border p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {question.type.replace("_", " ")}
        </p>
        <h2 className="mt-2 text-lg font-medium">{question.prompt}</h2>
        <div className="mt-4">
          {question.type === "SHORT_ANSWER" ? (
            <ShortAnswerInput
              value={shortAnswer}
              onChange={setShortAnswer}
              disabled={submitting}
            />
          ) : (
            <McqOptions
              options={question.options ?? []}
              selectedId={selectedOption}
              onSelect={setSelectedOption}
              disabled={submitting}
              showResult={lastResult !== null}
            />
          )}
        </div>
        {lastResult !== null ? (
          <p
            className={
              lastResult
                ? "mt-3 text-sm text-emerald-600"
                : "mt-3 text-sm text-destructive"
            }
          >
            {lastResult ? "Correct!" : "Incorrect — check the review at the end."}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end">
          <Button disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
            {index >= attempt.questions.length - 1 ? "Finish" : "Submit answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
