"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MENTOR_NAME, MENTOR_TAGLINE } from "@/constants/ai-persona";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
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
  className?: string;
};

function getFirstName(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

export function SageChat({ projectId, userName, section, className }: SageChatProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const transport = React.useMemo(
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
      <div className="flex-1 overflow-y-auto px-4 pb-36 pt-6 sm:px-6">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center pt-12 text-center sm:pt-20">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                <Sparkles className="size-8 text-primary" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {firstName ? `Hey ${firstName}, I'm ${MENTOR_NAME}` : `Hey there, I'm ${MENTOR_NAME}`}
            </h1>
            <p className="mt-2 max-w-md text-muted-foreground">{MENTOR_TAGLINE}</p>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground">
              Ask for explanations, study plans, or a nudge when motivation dips.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePrompt(prompt)}
                  className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-left text-xs text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary/10 text-foreground"
                    : "mr-auto bg-muted text-foreground",
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
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pt-16">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto mx-auto max-w-3xl px-4 sm:px-6"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background/95 p-2 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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
              className="shrink-0 rounded-xl"
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
