import { defineAiTask } from "@/lib/ai/kernel/define-task";
import { withMemoryContext } from "@/lib/ai/kernel/memory-context";
import { normalizeBlueprintResponse } from "@/lib/ai/normalize/blueprint";
import { normalizeRoadmapResponse } from "@/lib/ai/normalize/roadmap";
import { buildBlueprintPrompt } from "@/lib/ai/prompts/blueprint";
import { buildRoadmapPrompt } from "@/lib/ai/prompts/roadmap";
import { blueprintAiSchema } from "@/types/blueprint";
import type { BlueprintGeneration } from "@/types/blueprint";
import { roadmapAiSchema } from "@/types/roadmap";
import type { NormalizedRoadmap } from "@/types/roadmap";

export type BlueprintInput = {
  title: string;
  goal: string;
  category: string | null;
  answers: Array<{ questionKey: string; answer: unknown }>;
};

export const blueprintTask = defineAiTask<
  BlueprintInput,
  typeof blueprintAiSchema,
  BlueprintGeneration
>({
  id: "project.blueprint",
  flow: "blueprint",
  schema: blueprintAiSchema,
  evalSampleRate: 0.1,
  memory: {
    read: {
      scope: "user",
      agentId: "planner",
      kinds: ["preference", "goal"],
      topK: 5,
      query: (input) => `study habits and constraints for ${input.goal}`,
    },
  },
  buildPrompt: (input, ctx) =>
    withMemoryContext(buildBlueprintPrompt(input), ctx.memories),
  normalize: (raw) => normalizeBlueprintResponse(raw),
  validate: (output) =>
    output.milestones.length >= 2
      ? { ok: true }
      : { ok: false, issues: ["fewer than 2 milestones"] },
});

export type RoadmapInput = {
  title: string;
  goal: string;
  durationWeeks: number;
  methodology: string;
  blueprintTitle: string;
  stages: Array<{ order: number; title: string; description: string }>;
  answers: Array<{ questionKey: string; answer: unknown }>;
};

export const roadmapTask = defineAiTask<
  RoadmapInput,
  typeof roadmapAiSchema,
  NormalizedRoadmap
>({
  id: "project.roadmap",
  flow: "roadmap",
  schema: roadmapAiSchema,
  evalSampleRate: 0.1,
  memory: {
    read: {
      scope: "user",
      agentId: "planner",
      kinds: ["preference", "struggle"],
      topK: 5,
      query: (input) => `prior knowledge and weak areas for ${input.goal}`,
    },
  },
  buildPrompt: (input, ctx) =>
    withMemoryContext(buildRoadmapPrompt(input), ctx.memories),
  normalize: (raw, input) => normalizeRoadmapResponse(raw, input.durationWeeks),
  validate: (output) =>
    output.topics.length >= 4
      ? { ok: true }
      : { ok: false, issues: [`only ${output.topics.length} topics`] },
});
