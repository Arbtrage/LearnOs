import { Sparkles } from "lucide-react";
import { MENTOR_NAME } from "@/constants/ai-persona";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Explain today's focus topic",
  "Plan a 30-min session",
  "Help me reschedule",
];

type SageChatMockProps = {
  showPrompts?: boolean;
  className?: string;
};

export function SageChatMock({ showPrompts = true, className }: SageChatMockProps) {
  return (
    <div className={className}>
      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-md border border-border bg-card">
            <Sparkles className="size-3 text-primary" />
          </div>
          <div className="max-w-[85%] rounded-2xl border border-border bg-card px-3 py-2 text-xs leading-relaxed">
            You&apos;re behind on Reading Comprehension. Want me to compact today&apos;s plan and
            move practice to tomorrow?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl gradient-primary px-3 py-2 text-xs text-primary-foreground">
            Yes, adjust my plan for today.
          </div>
        </div>
        <div className="flex gap-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-md border border-border bg-card">
            <Sparkles className="size-3 text-primary" />
          </div>
          <div className="max-w-[85%] rounded-2xl border border-border bg-card px-3 py-2 text-xs leading-relaxed">
            Done. I moved the RC set to 7 PM and shortened revision to 20 min. You&apos;ll still
            finish core objectives in ~48 minutes.
          </div>
        </div>
      </div>
      {showPrompts ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
          {PROMPTS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-border bg-card/80 px-2.5 py-1 text-[10px] text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      ) : null}
      <p className="px-4 pb-3 text-[10px] text-muted-foreground">
        {MENTOR_NAME} · grounded in your syllabus and progress
      </p>
    </div>
  );
}

export function DailyLoopMock({ className }: { className?: string }) {
  const steps = ["Today", "Focus", "Practice", "Revision"];
  return (
    <div className={cn("flex flex-wrap gap-2 p-4", className)}>
      {steps.map((step, i) => (
        <div
          key={step}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
            i === 0 ? "border-primary/40 bg-primary/5 font-medium" : "border-border bg-card",
          )}
        >
          <span className="font-mono text-[10px] text-primary/60">0{i + 1}</span>
          {step}
        </div>
      ))}
    </div>
  );
}
