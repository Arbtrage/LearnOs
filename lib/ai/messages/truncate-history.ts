import type { UIMessage } from "ai";

const MAX_TURNS = 6;
const MAX_MESSAGES = MAX_TURNS * 2;

export type TruncatedHistory = {
  messages: UIMessage[];
  truncated: boolean;
};

export function truncateChatHistory(messages: UIMessage[]): TruncatedHistory {
  if (messages.length <= MAX_MESSAGES) {
    return { messages, truncated: false };
  }

  return {
    messages: messages.slice(-MAX_MESSAGES),
    truncated: true,
  };
}

export function historyTruncationNote(truncated: boolean): string | undefined {
  if (!truncated) {
    return undefined;
  }
  return "Earlier conversation turns were omitted. The learner profile in your instructions is authoritative.";
}
