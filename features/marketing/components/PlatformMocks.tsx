import {
  Brain,
  Check,
  CircleDashed,
  Loader2,
  MoveRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const chip = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium";

function StateChip({ state }: { state: "ready" | "preparing" | "queued" }) {
  if (state === "ready") {
    return (
      <span className={cn(chip, "border-success/25 bg-success/10 text-success")}>
        <Check className="size-2.5" aria-hidden /> Ready
      </span>
    );
  }
  if (state === "preparing") {
    return (
      <span className={cn(chip, "border-primary/25 bg-primary/10 text-primary")}>
        <Loader2 className="size-2.5 animate-spin" aria-hidden /> Preparing
      </span>
    );
  }
  return (
    <span className={cn(chip, "border-border bg-muted/40 text-muted-foreground")}>
      <CircleDashed className="size-2.5" aria-hidden /> Queued
    </span>
  );
}

const LEDGER_ROWS: Array<{
  topic: string;
  lesson: "ready" | "preparing" | "queued";
  questions: "ready" | "preparing" | "queued";
}> = [
  { topic: "Percentages", lesson: "ready", questions: "ready" },
  { topic: "Ratio & proportion", lesson: "ready", questions: "preparing" },
  { topic: "Time & work", lesson: "preparing", questions: "queued" },
];

/** Mirrors the AssetReadiness ledger: per-topic state for each asset kind. */
export function ReadinessLedgerMock() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Tomorrow&apos;s topics</span>
        <span>Warmed overnight</span>
      </div>
      {LEDGER_ROWS.map((row) => (
        <div
          key={row.topic}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
        >
          <span className="truncate text-xs font-medium">{row.topic}</span>
          <span className="flex shrink-0 gap-1.5">
            <StateChip state={row.lesson} />
            <StateChip state={row.questions} />
          </span>
        </div>
      ))}
    </div>
  );
}

const PROGRESS_STEPS = [
  { label: "Designing your learning blueprint", state: "done" as const },
  { label: "Mapping your curriculum", state: "running" as const },
  { label: "Setting up your workspace", state: "pending" as const },
];

/** Compact version of the real WorkspaceGeneratingScreen step list. */
export function LiveProgressMock() {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      {PROGRESS_STEPS.map((step) => (
        <div key={step.label} className="flex items-center gap-2.5 text-xs">
          {step.state === "done" ? (
            <Check className="size-3.5 text-success" aria-hidden />
          ) : step.state === "running" ? (
            <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
          ) : (
            <CircleDashed className="size-3.5 text-muted-foreground" aria-hidden />
          )}
          <span
            className={
              step.state === "pending" ? "text-muted-foreground" : "text-foreground/90"
            }
          >
            {step.label}
          </span>
        </div>
      ))}
      <p className="pt-1 text-[10px] text-muted-foreground">
        Live step updates — no silent spinner
      </p>
    </div>
  );
}

const MEMORIES = [
  "Struggled: compound interest ×3",
  "Prefers: evening sessions",
  "Strong: number systems",
];

/** Episodic memories flowing into a Sage reply. */
export function MemoryRecallMock() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {MEMORIES.map((memory) => (
          <span
            key={memory}
            className={cn(chip, "border-accent/25 bg-accent/10 text-accent")}
          >
            <Brain className="size-2.5" aria-hidden /> {memory}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1 pl-2 text-muted-foreground" aria-hidden>
        <MoveRight className="size-3.5" />
        <span className="text-[10px]">recalled at generation time</span>
      </div>
      <div className="flex gap-2">
        <div className="grid size-6 shrink-0 place-items-center rounded-md border border-border bg-card">
          <Sparkles className="size-3 text-primary" aria-hidden />
        </div>
        <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs leading-relaxed">
          Compound interest tripped you up before — this set starts with two easier
          ones to rebuild the pattern.
        </div>
      </div>
    </div>
  );
}

const PIPELINE = ["Blueprint", "Roadmap", "Lessons", "Questions"];

/** Durable job pipeline with a visible retry that still succeeded. */
export function DurableJobsMock() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {PIPELINE.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium",
                i < 2
                  ? "border-success/25 bg-success/10 text-success"
                  : i === 2
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground",
              )}
            >
              {stage}
            </span>
            {i < PIPELINE.length - 1 ? (
              <MoveRight className="size-3 text-muted-foreground/60" aria-hidden />
            ) : null}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px]">
        <RefreshCw className="size-3 text-warning" aria-hidden />
        <span className="text-muted-foreground">
          Lessons · attempt 2 —{" "}
          <span className="font-medium text-success">succeeded</span>. Timeouts never
          lose your work.
        </span>
      </div>
    </div>
  );
}
