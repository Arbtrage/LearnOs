"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { McqOptions } from "@/features/practice/McqOptions";
import { PracticeProgressBar } from "@/features/practice/PracticeProgressBar";
import { ShortAnswerInput } from "@/features/practice/ShortAnswerInput";
import type { MockExamAttemptDto, MockExamReviewDto } from "@/types/mock-exam";

type MockExamRunnerProps = {
  attempt: MockExamAttemptDto;
  onSaveAnswer: (questionId: string, userAnswer: unknown) => Promise<void>;
  onSubmit: () => Promise<MockExamReviewDto>;
  review?: MockExamReviewDto | null;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MockExamRunner({
  attempt,
  onSaveAnswer,
  onSubmit,
  review,
}: MockExamRunnerProps) {
  const [index, setIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [remaining, setRemaining] = React.useState(attempt.timeLimitMinutes * 60);
  const [warned, setWarned] = React.useState(false);

  const question = attempt.questions[index];
  const submitted = Boolean(review);

  React.useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          void onSubmit();
          return 0;
        }
        if (r <= 300 && !warned) setWarned(true);
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, warned, onSubmit]);

  async function saveCurrent() {
    if (!question) return;
    let userAnswer: unknown;
    if (question.type === "SHORT_ANSWER") {
      userAnswer = { text: shortAnswer.trim() };
    } else {
      userAnswer = { optionId: selectedOption };
    }
    await onSaveAnswer(question.id, userAnswer);
  }

  async function handleNext() {
    await saveCurrent();
    if (index < attempt.questions.length - 1) {
      setIndex((i) => i + 1);
      setSelectedOption(null);
      setShortAnswer("");
    }
  }

  async function handleSubmitAll() {
    setSubmitting(true);
    try {
      await saveCurrent();
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && review) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
        <h1 className="text-2xl font-semibold">Mock exam results</h1>
        <p className="text-lg">
          Score: {review.scorePercent}% ({review.marksObtained}/{review.marksTotal})
        </p>
        {review.sectionBreakdown.map((s) => (
          <div key={s.sectionTitle} className="text-sm">
            {s.sectionTitle}: {s.percent}% ({s.correct}/{s.total})
          </div>
        ))}
        <div className="space-y-4">
          {review.questions.filter((q) => !q.isCorrect).map((q) => (
            <div key={q.id} className="rounded-lg border p-4 space-y-2">
              <p className="text-xs text-muted-foreground">{q.topicTitle}</p>
              <p className="font-medium">{q.prompt}</p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      <div className="flex items-center justify-between text-sm">
        <span>{attempt.mockExamTitle}</span>
        <span className={remaining <= 300 ? "text-amber-600 font-medium" : ""}>
          {formatTime(remaining)}
          {warned && remaining > 0 ? " — 5 min left" : ""}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{attempt.topicTitles.join(" · ")}</p>
      <PracticeProgressBar current={index + 1} total={attempt.questions.length} />
      <div className="space-y-4">
        <p className="text-lg font-medium">{question.prompt}</p>
        {question.type === "SHORT_ANSWER" ? (
          <ShortAnswerInput value={shortAnswer} onChange={setShortAnswer} />
        ) : (
          <McqOptions
            options={question.options ?? []}
            selectedId={selectedOption}
            onSelect={setSelectedOption}
            showResult={false}
          />
        )}
      </div>
      <div className="flex gap-2">
        {index < attempt.questions.length - 1 ? (
          <Button onClick={() => void handleNext()}>Next</Button>
        ) : (
          <Button onClick={() => void handleSubmitAll()} disabled={submitting}>
            Submit exam
          </Button>
        )}
      </div>
    </div>
  );
}
