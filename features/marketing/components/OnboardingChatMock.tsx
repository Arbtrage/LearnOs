import { Progress } from "@/components/ui/progress";

const MESSAGES = [
  { role: "ai" as const, text: "What exam are you preparing for, and when is it?" },
  { role: "user" as const, text: "CAT 2027 — aiming for 99 percentile." },
  { role: "ai" as const, text: "How many hours can you study per week?" },
];

export function OnboardingChatMock() {
  return (
    <div className="space-y-3 p-4">
      {MESSAGES.map((m, i) => (
        <div
          key={i}
          className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
            m.role === "user"
              ? "ml-auto gradient-primary text-primary-foreground"
              : "border border-border bg-card text-foreground/90"
          }`}
        >
          {m.text}
        </div>
      ))}
      <div className="flex gap-1 px-1">
        <span className="size-1.5 animate-typing rounded-full bg-muted-foreground/60" />
        <span className="size-1.5 animate-typing rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="size-1.5 animate-typing rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function CreateProjectMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[10px] uppercase text-muted-foreground">Goal</p>
        <p className="mt-1 text-sm font-medium">Crack CAT 2027 with 99+ percentile</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-[10px] text-muted-foreground">Exam date</p>
          <p className="text-xs font-medium">Nov 2027</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-[10px] text-muted-foreground">Weekly hours</p>
          <p className="text-xs font-medium">18 hrs</p>
        </div>
      </div>
    </div>
  );
}

export function RoadmapMock() {
  const stages = [
    { name: "Foundation", progress: 100 },
    { name: "Core concepts", progress: 62 },
    { name: "Advanced + mocks", progress: 18 },
  ];

  return (
    <div className="space-y-3 p-4">
      {stages.map((stage) => (
        <div key={stage.name} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{stage.name}</span>
            <span className="text-muted-foreground">{stage.progress}%</span>
          </div>
          <Progress value={stage.progress} className="mt-2 h-1.5" />
        </div>
      ))}
    </div>
  );
}
