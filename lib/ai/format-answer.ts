import type { InterviewAnswerValue } from "@/types/onboarding";

export function formatAnswerCompact(answer: unknown): string {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (typeof answer === "boolean") {
    return answer ? "yes" : "no";
  }
  if (answer === null || answer === undefined) {
    return "";
  }
  return String(answer).trim();
}

export function formatAnswerForDisplay(answer: InterviewAnswerValue): string {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (typeof answer === "boolean") {
    return answer ? "Yes" : "No";
  }
  return String(answer);
}
