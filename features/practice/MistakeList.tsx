"use client";

import { Button } from "@/components/ui/button";
import type { MistakeEntryDto } from "@/types/mistakes";

type MistakeListProps = {
  mistakes: MistakeEntryDto[];
  onResolve: (id: string) => void;
  onRetry: () => void;
  retrying?: boolean;
};

export function MistakeList({ mistakes, onResolve, onRetry, retrying }: MistakeListProps) {
  if (mistakes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No unresolved mistakes. Keep practicing!</p>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={onRetry} disabled={retrying}>
        Retry mistakes ({mistakes.length})
      </Button>
      <ul className="space-y-3">
        {mistakes.map((m) => (
          <li key={m.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{m.topicTitle}</p>
                <p className="font-medium text-sm">{m.prompt}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onResolve(m.id)}>
                Resolve
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{m.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
