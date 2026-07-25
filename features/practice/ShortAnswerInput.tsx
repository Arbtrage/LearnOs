"use client";

type ShortAnswerInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ShortAnswerInput({ value, onChange, disabled }: ShortAnswerInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={3}
      placeholder="Type your answer..."
      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    />
  );
}
