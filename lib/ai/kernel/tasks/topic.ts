import { defineAiTask } from "@/lib/ai/kernel/define-task";
import { withMemoryContext } from "@/lib/ai/kernel/memory-context";
import {
  buildObjectivesPrompt,
  buildResourceRankPrompt,
  buildTopicLessonPrompt,
} from "@/lib/ai/prompts/topic-enrichment";
import { lintLessonSections } from "@/lib/content/markdown-lint";
import { normalizeMarkdownInput } from "@/lib/content/normalize-markdown";
import {
  filterValidObjectives,
  objectiveAiSchema,
  resourceRankAiSchema,
  topicLessonSectionsSchema,
} from "@/types/resources";

export type TopicObjectivesInput = {
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  sectionKey: string;
  stageTitle?: string | null;
  projectGoal: string;
};

const MIN_OBJECTIVES = 3;

export type TopicObjective = { title: string; description: string };

export const topicObjectivesTask = defineAiTask<
  TopicObjectivesInput,
  typeof objectiveAiSchema,
  TopicObjective[]
>({
  id: "topic.objectives",
  flow: "topic-enrichment",
  schema: objectiveAiSchema,
  attempts: 2,
  buildPrompt: (input) => buildObjectivesPrompt(input),
  normalize: (raw) => filterValidObjectives(raw.objectives),
  validate: (objectives) =>
    objectives.length >= MIN_OBJECTIVES
      ? { ok: true }
      : { ok: false, issues: ["objectives failed quality lint"] },
});

export type ResourceRankInput = {
  topicTitle: string;
  topicDescription: string;
  candidates: Array<{
    candidateId: string;
    url: string;
    title: string;
    domain: string;
  }>;
};

export const resourceRankTask = defineAiTask({
  id: "topic.resourceRank",
  flow: "topic-enrichment",
  schema: resourceRankAiSchema,
  buildPrompt: (input: ResourceRankInput) => buildResourceRankPrompt(input),
});

export type TopicLessonInput = {
  title: string;
  description: string;
  projectGoal: string;
};

export type LessonSection = {
  title: string;
  bodyMarkdown: string;
  order: number;
};

const LESSON_RETRY_HINT =
  "Previous output failed markdown validation. Return 2-3 sections with ### subheadings and bullet or numbered lists in every section.";

export const topicLessonTask = defineAiTask<
  TopicLessonInput,
  typeof topicLessonSectionsSchema,
  LessonSection[]
>({
  id: "topic.lesson",
  flow: "topic-lesson",
  schema: topicLessonSectionsSchema,
  attempts: 2,
  evalSampleRate: 0.15,
  memory: {
    read: {
      scope: "topic",
      agentId: "tutor",
      kinds: ["preference", "struggle"],
      topK: 4,
      query: (input) => `learning style and difficulties with ${input.title}`,
    },
  },
  buildPrompt: (input, ctx, attempt) => {
    const parts = withMemoryContext(buildTopicLessonPrompt(input), ctx.memories);
    if (attempt === 1) return parts;
    return { ...parts, user: `${parts.user}\n\n${LESSON_RETRY_HINT}` };
  },
  normalize: (raw) =>
    [...raw.sections]
      .sort((a, b) => a.order - b.order)
      .map((section, index) => ({
        title: section.title.trim(),
        bodyMarkdown: normalizeMarkdownInput(section.bodyMarkdown),
        order: index,
      })),
  validate: (sections) => {
    const lint = lintLessonSections(sections);
    return lint.ok ? { ok: true } : { ok: false, issues: lint.issues };
  },
});
