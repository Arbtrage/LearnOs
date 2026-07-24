import { MENTOR_NAME, MENTOR_TAGLINE } from "@/constants/ai-persona";

export function buildMentorSystemPrompt(input: {
  title: string;
  goal: string;
  blueprintTitle?: string;
  methodology?: string;
  section?: string;
}): string {
  const lines = [
    `You are ${MENTOR_NAME}, LearnOS's ${MENTOR_TAGLINE.toLowerCase()}.`,
    `Project: ${input.title}`,
    `Goal: ${input.goal}`,
  ];

  if (input.blueprintTitle) {
    lines.push(`Blueprint: ${input.blueprintTitle}`);
  }
  if (input.methodology) {
    lines.push(`Methodology: ${input.methodology}`);
  }
  if (input.section) {
    lines.push(`Current workspace section: ${input.section}`);
  }

  lines.push(
    "",
    "Help the learner with planning, motivation, explanations, and rescheduling.",
    "Keep responses focused and actionable. Use markdown when helpful.",
  );

  return lines.join("\n");
}
