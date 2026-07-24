"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InterviewAnswerValue, Question } from "@/types/onboarding";

type QuestionRendererProps = {
  question: Question;
  onSubmit: (value: InterviewAnswerValue) => void;
  isSubmitting?: boolean;
};

export function QuestionRenderer({
  question,
  onSubmit,
  isSubmitting = false,
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
        onSubmit(textValue.trim());
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
        onSubmit(parsed);
        return;
      }
      case "single_select":
        if (!selectValue) {
          setError("Select an option");
          return;
        }
        onSubmit(selectValue);
        return;
      case "multi_select":
        if (question.required && multiValues.length === 0) {
          setError("Select at least one option");
          return;
        }
        onSubmit(multiValues);
        return;
      case "date":
        if (question.required && !dateValue) {
          setError("Select a date");
          return;
        }
        onSubmit(dateValue);
        return;
      case "boolean":
        onSubmit(boolValue);
        return;
      case "slider":
        onSubmit(sliderValue);
        return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label htmlFor={`question-${question.key}`} className="text-base font-medium">
        {question.label}
      </Label>

      {question.type === "text" ? (
        <Input
          id={`question-${question.key}`}
          placeholder={question.placeholder}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
        />
      ) : null}

      {question.type === "textarea" ? (
        <textarea
          id={`question-${question.key}`}
          className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={question.maxLength}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
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
        />
      ) : null}

      {question.type === "date" ? (
        <Input
          id={`question-${question.key}`}
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
        />
      ) : null}

      {question.type === "single_select" ? (
        <Select
          value={selectValue}
          onValueChange={(value) => setSelectValue(value ?? "")}
        >
          <SelectTrigger id={`question-${question.key}`}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {question.type === "multi_select" ? (
        <div className="space-y-2">
          {question.options.map((option) => {
            const checked = multiValues.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
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
                <span className="text-sm">{option.label}</span>
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Continue"}
      </Button>
    </form>
  );
}
