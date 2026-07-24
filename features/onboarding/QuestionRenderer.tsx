"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { InterviewAnswerValue, Question } from "@/types/onboarding";

type QuestionRendererProps = {
  question: Question;
  onSubmit: (value: InterviewAnswerValue) => void;
  isSubmitting?: boolean;
  variant?: "default" | "typeform";
};

export function QuestionRenderer({
  question,
  onSubmit,
  isSubmitting = false,
  variant = "default",
}: QuestionRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [multiValues, setMultiValues] = useState<string[]>([]);
  const [dateValue, setDateValue] = useState("");
  const [boolValue, setBoolValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(
    question.type === "slider" ? question.min : 0,
  );

  const isTypeform = variant === "typeform";

  const submit = (value: InterviewAnswerValue) => {
    setError(null);
    onSubmit(value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    switch (question.type) {
      case "text":
      case "textarea":
        if (question.required && !textValue.trim()) {
          setError("Required");
          return;
        }
        submit(textValue.trim());
        return;
      case "number": {
        const parsed = Number(numberValue);
        if (Number.isNaN(parsed)) {
          setError("Enter a valid number");
          return;
        }
        if (question.min !== undefined && parsed < question.min) {
          setError(`Minimum is ${question.min}`);
          return;
        }
        if (question.max !== undefined && parsed > question.max) {
          setError(`Maximum is ${question.max}`);
          return;
        }
        submit(parsed);
        return;
      }
      case "single_select":
        if (!selectValue) {
          setError("Select an option");
          return;
        }
        submit(selectValue);
        return;
      case "multi_select":
        if (question.required && multiValues.length === 0) {
          setError("Select at least one option");
          return;
        }
        submit(multiValues);
        return;
      case "date":
        if (question.required && !dateValue) {
          setError("Select a date");
          return;
        }
        submit(dateValue);
        return;
      case "boolean":
        submit(boolValue);
        return;
      case "slider":
        submit(sliderValue);
        return;
    }
  };

  const inputClass = isTypeform ? "h-12 text-base" : undefined;
  const textareaClass = isTypeform
    ? "min-h-32 text-base"
    : "min-h-24";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isTypeform ? (
        <Label htmlFor={`question-${question.key}`} className="text-base font-medium">
          {question.label}
        </Label>
      ) : null}

      {question.type === "text" ? (
        <Input
          id={`question-${question.key}`}
          placeholder={question.placeholder}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          className={inputClass}
          autoFocus
        />
      ) : null}

      {question.type === "textarea" ? (
        <textarea
          id={`question-${question.key}`}
          className={cn(
            "flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            textareaClass,
          )}
          maxLength={question.maxLength}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          autoFocus
        />
      ) : null}

      {question.type === "number" ? (
        <Input
          id={`question-${question.key}`}
          type="number"
          min={question.min}
          max={question.max}
          value={numberValue}
          onChange={(e) => setNumberValue(e.target.value)}
          className={inputClass}
          autoFocus
        />
      ) : null}

      {question.type === "date" ? (
        <Input
          id={`question-${question.key}`}
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className={inputClass}
          autoFocus
        />
      ) : null}

      {question.type === "single_select" ? (
        <div className={cn("space-y-2", isTypeform && "space-y-3")}>
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSelectValue(option.value);
                if (isTypeform) submit(option.value);
              }}
              className={cn(
                "flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                selectValue === option.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:border-primary/40 hover:bg-muted/50",
                isTypeform && "py-4 text-base",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {question.type === "multi_select" ? (
        <div className={cn("space-y-2", isTypeform && "space-y-3")}>
          {question.options.map((option) => {
            const checked = multiValues.includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border px-4 py-3",
                  checked && "border-primary bg-primary/5",
                  isTypeform && "py-4",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    setMultiValues((current) =>
                      isChecked
                        ? [...current, option.value]
                        : current.filter((v) => v !== option.value),
                    );
                  }}
                />
                <span className={cn("text-sm", isTypeform && "text-base")}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      ) : null}

      {question.type === "boolean" ? (
        <div className="flex items-center gap-3">
          <Switch
            id={`question-${question.key}`}
            checked={boolValue}
            onCheckedChange={setBoolValue}
          />
          <span className="text-sm text-muted-foreground">
            {boolValue ? "Yes" : "No"}
          </span>
        </div>
      ) : null}

      {question.type === "slider" ? (
        <div className="space-y-3">
          <Slider
            min={question.min}
            max={question.max}
            step={question.step ?? 1}
            value={[sliderValue]}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              if (typeof next === "number") setSliderValue(next);
            }}
          />
          <p className="text-sm text-muted-foreground">Selected: {sliderValue}</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {question.type !== "single_select" || !isTypeform ? (
        <Button type="submit" size={isTypeform ? "lg" : "default"} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : isTypeform ? "Continue" : "Continue"}
        </Button>
      ) : null}
    </form>
  );
}
