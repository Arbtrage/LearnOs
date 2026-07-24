"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/onboarding";

type AIChatProps = {
  messages: ChatMessage[];
  className?: string;
};

export function AIChat({ messages, className }: AIChatProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)} aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
