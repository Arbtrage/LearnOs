"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { MENTOR_NAME, MENTOR_TAGLINE } from "@/constants/ai-persona";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_SUGGESTED_PROMPTS = [
  "Explain today's focus topic in simple terms",
  "Plan a focused 30-minute study session",
  "Help me reschedule if I'm behind",
  "Motivate me to stay consistent this week",
];

const MAX_TEXTAREA_ROWS = 4;
const LINE_HEIGHT_PX = 24;

type SageChatProps = {
  projectId: string;
  userName?: string | null;
  section?: string;
  taskId?: string;
  topicId?: string | null;
  incompleteObjectives?: string[];
  suggestedPrompts?: string[];
  className?: string;
};

function getFirstName(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

export function SageChat({
  projectId,
  userName,
  section,
  taskId,
  topicId,
  incompleteObjectives,
  suggestedPrompts = DEFAULT_SUGGESTED_PROMPTS,
  className,
}: SageChatProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/mentor`,
        body: {
          section,
          taskId,
          topicId: topicId ?? undefined,
          incompleteObjectives,
        },
      }),
    [projectId, section, taskId, topicId, incompleteObjectives],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const firstName = getFirstName(userName);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_TEXTAREA_ROWS;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [input]);

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
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      <div className="flex-1 overflow-y-auto px-4 pb-36 pt-4 sm:px-4">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center pt-8 text-center sm:pt-12">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative flex size-14 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Sparkles className="size-7 text-primary" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {firstName ? `Hey ${firstName}, I'm ${MENTOR_NAME}` : `Hey there, I'm ${MENTOR_NAME}`}
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{MENTOR_TAGLINE}</p>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground">
              Ask for explanations, study plans, or a nudge when motivation dips.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal px-3 py-2 text-left text-xs"
                  onClick={() => handlePrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message, messageIndex) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" ? (
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-card">
                    <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                  </div>
                ) : null}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "gradient-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground/90",
                  )}
                >
                  {message.role === "assistant" ? (
                    <MarkdownContent
                      variant="chat"
                      isAnimating={
                        isLoading && messageIndex === messages.length - 1
                      }
                    >
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((p) => (p.type === "text" ? p.text : ""))
                        .join("")}
                    </MarkdownContent>
                  ) : (
                    message.parts
                      .filter((p) => p.type === "text")
                      .map((p) => (p.type === "text" ? p.text : ""))
                      .join("")
                  )}
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="flex gap-2">
                <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-card">
                  <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex gap-1">
                    <span className="size-2 animate-typing rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="size-2 animate-typing rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="size-2 animate-typing rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent pb-4 pt-12">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto mx-auto max-w-3xl px-4"
        >
          <div className="flex items-end gap-2 rounded-lg border border-border/60 bg-background/95 p-2 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Ask ${MENTOR_NAME}...`}
              rows={1}
              className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="gradient-primary shrink-0 text-primary-foreground"
              disabled={isLoading || !input.trim()}
            >
              <Send className="size-4" aria-hidden="true" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
