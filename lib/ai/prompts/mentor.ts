import { MENTOR_NAME, MENTOR_TAGLINE } from "@/constants/ai-persona";
import { formatAnswerCompact } from "@/lib/ai/format-answer";
import { memoryContextBlock } from "@/lib/ai/kernel/memory-context";
import type { AiMemory } from "@/lib/ai/kernel/types";
import type { PromptParts } from "@/lib/ai/prompts/parts";

export type MentorPromptInput = {
  title: string;
  goal: string;
  blueprintTitle?: string;
  methodology?: string;
  currentMilestone?: string;
  section?: string;
  interviewAnswers?: Array<{ questionKey: string; answer: unknown }>;
  focusTaskTitle?: string;
  focusTaskType?: string;
  focusTopicTitle?: string;
  focusTopicDescription?: string;
  focusResourceTitle?: string;
  incompleteObjectives?: string[];
  /** Recalled episodes so the mentor remembers across threads. */
  memories?: AiMemory[];
};

export function buildMentorPrompt(input: MentorPromptInput): PromptParts {
  const profileLines: string[] = [];

  if (input.interviewAnswers && input.interviewAnswers.length > 0) {
    profileLines.push("Learner profile (from onboarding):");
    for (const answer of input.interviewAnswers.slice(0, 8)) {
      profileLines.push(
        `- ${answer.questionKey}: ${formatAnswerCompact(answer.answer)}`,
      );
    }
  }

  const focusLines: string[] = [];
  if (input.focusTaskTitle) {
    focusLines.push(`Current task: ${input.focusTaskTitle}`);
  }
  if (input.focusTaskType) {
    focusLines.push(`Task type: ${input.focusTaskType}`);
  }
  if (input.focusTopicTitle) {
    focusLines.push(`Topic: ${input.focusTopicTitle}`);
  }
  if (input.focusTopicDescription) {
    focusLines.push(`Topic context: ${input.focusTopicDescription}`);
  }
  if (input.focusResourceTitle) {
    focusLines.push(`Linked resource: ${input.focusResourceTitle}`);
  }
  if (input.incompleteObjectives && input.incompleteObjectives.length > 0) {
    focusLines.push("Incomplete objectives:");
    for (const objective of input.incompleteObjectives.slice(0, 8)) {
      focusLines.push(`- ${objective}`);
    }
  }

  const memoryBlock = memoryContextBlock(input.memories ?? []);

  const dynamicLines = [
    `Project: ${input.title}`,
    `Goal: ${input.goal}`,
    input.blueprintTitle ? `Blueprint: ${input.blueprintTitle}` : "",
    input.methodology ? `Methodology: ${input.methodology}` : "",
    input.currentMilestone ? `Current milestone: ${input.currentMilestone}` : "",
    input.section ? `Current workspace section: ${input.section}` : "",
    focusLines.length > 0 ? "" : "",
    ...focusLines,
    profileLines.length > 0 ? "" : "",
    ...profileLines,
    memoryBlock ? "" : "",
    memoryBlock,
  ].filter((line, index, arr) => line !== "" || index < arr.length - 1);

  return {
    staticSystem: `You are ${MENTOR_NAME}, LearnOS's ${MENTOR_TAGLINE.toLowerCase()}.

Help the learner with planning, motivation, explanations, and rescheduling.
When focus context is provided, tie answers to the current task, topic, and objectives.
Keep responses focused and actionable. Use markdown when helpful.`,
    dynamicSystem: dynamicLines.join("\n"),
    user: "",
  };
}
