import { inngest } from "@/lib/jobs/client";
import { projectChannel } from "@/lib/jobs/channels";
import {
  projectMockExamRequested,
  topicQuestionsRequested,
} from "@/lib/jobs/events";
import {
  GEMINI_THROTTLE,
  PER_PROJECT_CONCURRENCY,
  PER_USER_CONCURRENCY,
  PRIORITY_BY_REASON,
} from "@/lib/jobs/flow-control";
import { AssetReadinessService } from "@/server/services/asset-readiness.service";
import { MockExamService } from "@/server/services/mock-exam.service";
import { QuestionService } from "@/server/services/question.service";
import { questionRepository } from "@/server/repositories/question.repository";

const DEFAULT_QUESTION_COUNT = 10;
const DEFAULT_MOCK_EXAM_QUESTIONS = 20;

export const topicQuestionsFn = inngest.createFunction(
  {
    id: "topic-questions",
    name: "Generate topic questions",
    triggers: [topicQuestionsRequested],
    concurrency: PER_USER_CONCURRENCY,
    throttle: GEMINI_THROTTLE.standard,
    priority: { run: PRIORITY_BY_REASON },
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId, projectId, topicId } = event.data;
    const ref = { projectId, topicId, kind: "QUESTIONS" as const };
    const channel = projectChannel(projectId);

    const existing = await step.run("count-existing", () =>
      questionRepository.countActiveByTopic(topicId),
    );

    if (existing > 0) {
      await step.run("mark-ready", () => AssetReadinessService.markReady(ref));
      return { skipped: true as const, questionsCreated: 0 };
    }

    const claimed = await step.run("claim", () =>
      AssetReadinessService.markRunning(ref, event.id ?? topicId),
    );

    if (!claimed) {
      return { skipped: true as const, questionsCreated: 0 };
    }

    await step.realtime.publish("publish-questions-start", channel.generation, {
      step: "topic.questions",
      state: "running",
      label: "Writing practice questions",
      completed: 0,
      total: 1,
      topicId,
    });

    const result = await step.run("generate", async () => {
      try {
        const generated = await QuestionService.generateForTopic(
          userId,
          topicId,
          event.data.count ?? DEFAULT_QUESTION_COUNT,
        );
        await AssetReadinessService.markReady(ref);
        return generated;
      } catch (error) {
        await AssetReadinessService.markFailed(ref, error);
        throw error;
      }
    });

    await step.realtime.publish("publish-questions-ready", channel.generation, {
      step: "topic.questions",
      state: "ready",
      label: `${result.questionsCreated} practice questions ready`,
      completed: 1,
      total: 1,
      topicId,
    });

    return { skipped: false as const, ...result };
  },
);

export const projectMockExamFn = inngest.createFunction(
  {
    id: "project-mock-exam",
    name: "Generate mock exam",
    triggers: [projectMockExamRequested],
    concurrency: PER_PROJECT_CONCURRENCY,
    throttle: GEMINI_THROTTLE.heavy,
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId, projectId } = event.data;
    const ref = { projectId, topicId: null, kind: "MOCK_EXAM" as const };

    const claimed = await step.run("claim", () =>
      AssetReadinessService.markRunning(ref, event.id ?? projectId),
    );

    if (!claimed) {
      return { skipped: true as const };
    }

    return step.run("generate", async () => {
      try {
        const exam = await MockExamService.generate(
          userId,
          projectId,
          event.data.questionCount ?? DEFAULT_MOCK_EXAM_QUESTIONS,
        );
        await AssetReadinessService.markReady(ref);
        return { skipped: false as const, examId: exam.id };
      } catch (error) {
        await AssetReadinessService.markFailed(ref, error);
        throw error;
      }
    });
  },
);
