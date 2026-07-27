/**
 * Importing this module registers every AI task. Background workers and the
 * eval harness rely on the registry being populated, so import it for side
 * effects at any entry point that resolves tasks by id.
 */
export {
  onboardingQuestionnaireTask,
  projectSuggestTask,
  type OnboardingQuestionnaireInput,
  type ProjectSuggestInput,
} from "@/lib/ai/kernel/tasks/onboarding";

export {
  blueprintTask,
  roadmapTask,
  type BlueprintInput,
  type RoadmapInput,
} from "@/lib/ai/kernel/tasks/planning";

export {
  resourceRankTask,
  topicLessonTask,
  topicObjectivesTask,
  type LessonSection,
  type ResourceRankInput,
  type TopicLessonInput,
  type TopicObjectivesInput,
} from "@/lib/ai/kernel/tasks/topic";

export {
  mockExamTask,
  questionGenerationTask,
  MIN_USABLE_QUESTIONS,
  MIN_MOCK_EXAM_QUESTIONS,
  type MockExamInput,
  type MockExamOutput,
  type QuestionGenerationInput,
  type QuestionGenerationOutput,
} from "@/lib/ai/kernel/tasks/practice";
