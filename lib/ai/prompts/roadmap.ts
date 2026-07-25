import { LEARNING_FRAMEWORK_SECTIONS } from "@/lib/navigation/learning-framework";
import { formatAnswerCompact } from "@/lib/ai/format-answer";
import type { PromptParts } from "@/lib/ai/prompts/parts";
import { SECTION_KEYS } from "@/types/roadmap";

export function buildRoadmapPrompt(input: {
  title: string;
  goal: string;
  durationWeeks: number;
  methodology: string;
  blueprintTitle: string;
  stages: Array<{ order: number; title: string; description: string }>;
  answers: Array<{ questionKey: string; answer: unknown }>;
}): PromptParts {
  const stageLines = input.stages.map(
    (stage) =>
      `- Stage ${stage.order}: ${stage.title} — ${stage.description.slice(0, 120)}`,
  );

  const answerLines = input.answers.map(
    (a) => `${a.questionKey}: ${formatAnswerCompact(a.answer)}`,
  );

  const topicGuidance = Math.min(
    40,
    Math.max(8, Math.round(input.durationWeeks * 3.5)),
  );

  return {
    staticSystem: `You are LearnOS, an expert curriculum designer. Generate a personalized learning roadmap as JSON.

Bloom sections (sectionKey must be one of): ${SECTION_KEYS.join(", ")}.
Section meanings:
${LEARNING_FRAMEWORK_SECTIONS.map((s) => `- ${s.key}: ${s.label} — ${s.subtitle}`).join("\n")}

Rules:
1. Return JSON matching the schema exactly — no markdown.
2. Create ${topicGuidance} topics (±20%) scaled to duration and learner background.
3. dependencies must form a DAG (no cycles). parentSlug is prerequisite for childSlug.
4. Every topic needs title, description, estimatedHours, difficulty (BEGINNER|INTERMEDIATE|ADVANCED), sectionKey, order.
5. stageOrder links topics to blueprint stages when relevant (optional).
6. milestoneSchedule: map stageOrder to dueWeekOffset within ${input.durationWeeks} weeks.
7. suggestedOrder: slugs in recommended learning sequence.
8. Root topics (no parents) should use sectionKey "foundation" or "learn".`,
    dynamicSystem: [
      `Blueprint: ${input.blueprintTitle}`,
      `Methodology: ${input.methodology}`,
      `Duration: ${input.durationWeeks} weeks`,
      "",
      "Blueprint stages:",
      ...stageLines,
      answerLines.length > 0 ? "" : "",
      ...(answerLines.length > 0 ? ["Interview answers:", ...answerLines] : []),
    ]
      .filter((line, index, arr) => line !== "" || index < arr.length - 1)
      .join("\n"),
    user: `Project: ${input.title}\nGoal: ${input.goal}\n\nGenerate the roadmap JSON.`,
  };
}
