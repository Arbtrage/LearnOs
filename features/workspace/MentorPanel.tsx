"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Explain today's focus topic in simple terms",
  "Plan a focused 30-minute study session",
  "Help me reschedule if I'm behind",
  "Motivate me to stay consistent this week",
];

type MentorPanelProps = {
  projectId: string;
  section?: string;
  onClose?: () => void;
  className?: string;
};

export function MentorPanel({
  projectId,
  section,
  onClose,
  className,
}: MentorPanelProps) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/mentor`,
        body: { section },
      }),
    [projectId, section],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage({ text });
  }

  function handlePrompt(prompt: string) {
    if (isLoading) return;
    void sendMessage({ text: prompt });
  }

  return (
    <div className={cn("flex h-full flex-col border-l border-border bg-background", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-medium">AI Mentor</h2>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close mentor">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask for explanations, study plans, or motivation.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePrompt(prompt)}
                  className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "ml-8 bg-primary/10 text-foreground"
                  : "mr-4 bg-muted text-foreground",
              )}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.parts
                      .filter((p) => p.type === "text")
                      .map((p) => (p.type === "text" ? p.text : ""))
                      .join("")}
                  </ReactMarkdown>
                </div>
              ) : (
                message.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("")
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor..."
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
