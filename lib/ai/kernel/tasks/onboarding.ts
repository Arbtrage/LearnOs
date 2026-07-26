import { defineAiTask } from "@/lib/ai/kernel/define-task";
import { withMemoryContext } from "@/lib/ai/kernel/memory-context";
import { normalizeOnboardingBatchResponse } from "@/lib/ai/normalize/onboarding";
import { buildOnboardingBatchPrompt } from "@/lib/ai/prompts/onboarding-batch";
import { buildProjectSuggestPrompt } from "@/lib/ai/prompts/project-suggest";
import type { PastProjectContext } from "@/lib/ai/prompts/onboarding-types";
import { onboardingBatchAiSchema } from "@/types/onboarding";
import type { QuestionnaireMetadata } from "@/types/onboarding";
import { projectSuggestSchema } from "@/types/project-suggest";

export type OnboardingQuestionnaireInput = {
  title: string;
  goal: string;
  priorAnswers: Array<{ questionKey: string; answer: unknown }>;
  pastProjects: PastProjectContext[];
};

export const onboardingQuestionnaireTask = defineAiTask<
  OnboardingQuestionnaireInput,
  typeof onboardingBatchAiSchema,
  QuestionnaireMetadata
>({
  id: "onboarding.questionnaire",
  flow: "onboarding",
  schema: onboardingBatchAiSchema,
  evalSampleRate: 0.05,
  memory: {
    read: {
      scope: "user",
      agentId: "planner",
      kinds: ["preference", "goal"],
      topK: 5,
      query: (input) => `learning preferences relevant to ${input.goal}`,
    },
  },
  buildPrompt: (input, ctx) =>
    withMemoryContext(
      buildOnboardingBatchPrompt(
        input.title,
        input.goal,
        input.priorAnswers,
        input.pastProjects,
      ),
      ctx.memories,
    ),
  normalize: (raw) => normalizeOnboardingBatchResponse(raw),
  validate: (output) => {
    const count = output.questions.length;
    return count >= 3
      ? { ok: true }
      : { ok: false, issues: [`only ${count} questions returned`] };
  },
});

export type ProjectSuggestInput = { intent: string };

export const projectSuggestTask = defineAiTask({
  id: "project.suggest",
  flow: "project-suggest",
  schema: projectSuggestSchema,
  buildPrompt: (input: ProjectSuggestInput) =>
    buildProjectSuggestPrompt(input.intent),
});
