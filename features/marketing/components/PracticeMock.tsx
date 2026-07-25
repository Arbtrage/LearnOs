import { Badge } from "@/components/ui/badge";

export function PracticeMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">Quant · Set 4</p>
        <Badge variant="secondary" className="text-[10px]">
          78% accuracy
        </Badge>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs leading-relaxed">
          If x² + y² = 25 and x + y = 7, what is xy?
        </p>
        <div className="mt-3 space-y-1.5">
          {["A. 12", "B. 10", "C. 8", "D. 6"].map((opt, i) => (
            <div
              key={opt}
              className={`rounded-md border px-2 py-1.5 text-[11px] ${
                i === 0 ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RevisionMock() {
  return (
    <div className="p-4">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Front</p>
        <p className="mt-2 text-sm font-medium">What is the formula for compound interest?</p>
        <p className="mt-4 text-[10px] text-muted-foreground">Tap to reveal · Due today</p>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>12 cards due</span>
        <span>Offline ready</span>
      </div>
    </div>
  );
}
