import {
  projectBlueprintFn,
  projectRoadmapFn,
} from "@/lib/jobs/functions/project-blueprint";
import {
  topicEnrichFn,
  topicResourcesFn,
} from "@/lib/jobs/functions/topic-enrich";
import {
  projectMockExamFn,
  topicQuestionsFn,
} from "@/lib/jobs/functions/practice";
import {
  prewarmProjectFn,
  prewarmScheduleFn,
  topicWarmFn,
} from "@/lib/jobs/functions/prewarm";
import { memoryWriteFn } from "@/lib/jobs/functions/memory";

export const functions = [
  projectBlueprintFn,
  projectRoadmapFn,
  topicEnrichFn,
  topicResourcesFn,
  topicQuestionsFn,
  projectMockExamFn,
  prewarmScheduleFn,
  prewarmProjectFn,
  topicWarmFn,
  memoryWriteFn,
];
