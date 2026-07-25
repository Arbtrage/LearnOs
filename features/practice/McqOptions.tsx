"use client";

import { cn } from "@/lib/utils";

type McqOptionsProps = {
  options: Array<{ id: string; text: string }>;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  showResult?: boolean;
  correctId?: string | null;
};

export function McqOptions({
  options,
  selectedId,
  onSelect,
  disabled,
  showResult,
  correctId,
}: McqOptionsProps) {
  return (
    <ul className="space-y-2">
      {options.map((option, index) => {
        const isSelected = selectedId === option.id;
        const isCorrect = showResult && correctId === option.id;
        const isWrong = showResult && isSelected && correctId !== option.id;

        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                isSelected && !showResult && "border-primary bg-primary/5",
                isCorrect && "border-emerald-500 bg-emerald-500/10",
                isWrong && "border-destructive bg-destructive/10",
                !isSelected && !showResult && "hover:bg-muted/50",
              )}
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium">
                {index + 1}
              </span>
              <span>{option.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
