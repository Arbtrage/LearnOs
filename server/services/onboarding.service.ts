import { parseQuestionnaireMetadata } from "@/lib/ai/normalize/onboarding";
import { formatAnswerForDisplay } from "@/lib/ai/format-answer";
import { runAiTask } from "@/lib/ai/kernel";
import { onboardingQuestionnaireTask } from "@/lib/ai/kernel/tasks";
import type { PastProjectContext } from "@/lib/ai/prompts/onboarding-types";
import { toUserFacingAIError } from "@/lib/ai/errors";
import type { Prisma } from "@/app/generated/prisma/client";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { messageRepository } from "@/server/repositories/message.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import {
  questionSchema,
  type InterviewAnswerValue,
  type OnboardingState,
  type Question,
  type QuestionnaireMetadata,
} from "@/types/onboarding";

const MAX_PAST_PROJECTS = 3;

export class OnboardingService {
  static async getOrStartOnboarding(
    userId: string,
    projectSlug: string,
  ): Promise<OnboardingState> {
    const project = await projectRepository.findByUserAndSlug(
      userId,
      projectSlug,
    );
    if (!project) {
      throw new Error("Project not found");
    }

    let conversation = await conversationRepository.findActiveByProjectId(
      project.id,
    );

    if (!conversation) {
      conversation = await conversationRepository.create(project.id);
      await projectRepository.updateStatus(project.id, "ONBOARDING");
    }

    return this.ensureQuestionnaire(userId, conversation.id, project);
  }

  static async bootstrapConversation(
    userId: string,
    conversationId: string,
  ): Promise<OnboardingState> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation || conversation.project.userId !== userId) {
      throw new Error("Conversation not found");
    }

    if (conversation.completedAt) {
      throw new Error("Interview already completed");
    }

    const project = await projectRepository.findById(conversation.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return this.ensureQuestionnaire(userId, conversationId, project);
  }

  static async submitAnswer(
    userId: string,
    conversationId: string,
    questionKey: string,
    answer: InterviewAnswerValue,
  ): Promise<OnboardingState> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation || conversation.project.userId !== userId) {
      throw new Error("Conversation not found");
    }

    if (conversation.completedAt) {
      throw new Error("Interview already completed");
    }

    const project = await projectRepository.findById(conversation.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const questionnaire = await this.getQuestionnaire(conversationId);
    if (!questionnaire) {
      throw new Error("Interview not ready. Please refresh and try again.");
    }

    const answers = await interviewAnswerRepository.listByConversationId(
      conversationId,
    );
    const currentIndex = answers.length;
    const currentQuestion = questionnaire.questions[currentIndex];

    if (!currentQuestion || currentQuestion.key !== questionKey) {
      throw new Error("Unexpected question. Please refresh and continue.");
    }

    await interviewAnswerRepository.upsert(
      conversationId,
      questionKey,
      answer as never,
    );

    await messageRepository.create({
      conversationId,
      role: "user",
      content: formatAnswerForDisplay(answer),
    });

    const updatedAnswers = await interviewAnswerRepository.listByConversationId(
      conversationId,
    );

    if (updatedAnswers.length >= questionnaire.questions.length) {
      await messageRepository.create({
        conversationId,
        role: "assistant",
        content: questionnaire.closingSummary,
      });
      await conversationRepository.complete(conversationId);
      await projectRepository.updateStatus(project.id, "GENERATING");
    }

    return this.loadState(conversationId, project);
  }

  private static async ensureQuestionnaire(
    userId: string,
    conversationId: string,
    project: {
      id: string;
      slug: string;
      title: string;
      goal: string;
      category?: string | null;
    },
  ): Promise<OnboardingState> {
    const state = await this.loadState(conversationId, project);
    if (state.isComplete || state.currentQuestion) {
      return state;
    }

    const existing = await this.getQuestionnaire(conversationId);
    if (existing) {
      return state;
    }

    const priorAnswers = await interviewAnswerRepository.listByConversationId(
      conversationId,
    );
    const pastProjects = await this.loadPastProjects(userId, project.id);

    const questionnaire = await this.generateQuestionnaire(
      project.title,
      project.goal,
      priorAnswers.map((a) => ({
        questionKey: a.questionKey,
        answer: a.answer,
      })),
      pastProjects,
      { userId, projectId: project.id },
    );

    await messageRepository.create({
      conversationId,
      role: "assistant",
      content: questionnaire.introMessage,
      metadata: questionnaire as unknown as Prisma.InputJsonValue,
    });

    return this.loadState(conversationId, project);
  }

  private static async getQuestionnaire(
    conversationId: string,
  ): Promise<QuestionnaireMetadata | null> {
    const messages = await messageRepository.listByConversationId(conversationId);
    for (const message of messages) {
      if (message.role !== "assistant" || !message.metadata) {
        continue;
      }
      const parsed = parseQuestionnaireMetadata(message.metadata);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private static async loadPastProjects(
    userId: string,
    currentProjectId: string,
  ): Promise<PastProjectContext[]> {
    const projects = await projectRepository.listByUserId(userId);
    const others = projects.filter((p) => p.id !== currentProjectId);
    const cap = others.length < 5 ? others.length : MAX_PAST_PROJECTS;

    return others.slice(0, cap).map((p) => ({
      title: p.title,
      goal: p.goal,
      category: p.category,
      status: p.status,
    }));
  }

  private static async generateQuestionnaire(
    title: string,
    goal: string,
    priorAnswers: Array<{ questionKey: string; answer: unknown }>,
    pastProjects: PastProjectContext[],
    invocation: { userId: string; projectId: string },
  ): Promise<QuestionnaireMetadata> {
    try {
      return await runAiTask(
        onboardingQuestionnaireTask,
        { title, goal, priorAnswers, pastProjects },
        invocation,
      );
    } catch (error) {
      throw toUserFacingAIError(error);
    }
  }

  private static async loadState(
    conversationId: string,
    project: { slug: string; title: string; goal: string },
  ): Promise<OnboardingState> {
    const messages = await messageRepository.listByConversationId(
      conversationId,
    );
    const answers = await interviewAnswerRepository.listByConversationId(
      conversationId,
    );
    const conversation = await conversationRepository.findById(conversationId);
    const questionnaire = await this.getQuestionnaire(conversationId);

    const chatMessages = messages.map((m) => {
      const legacyQuestion =
        m.metadata && m.role === "assistant"
          ? parseLegacyQuestionMetadata(m.metadata)
          : null;

      return {
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        ...(legacyQuestion ? { question: legacyQuestion } : {}),
      };
    });

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    let currentQuestion: Question | null = null;
    let summary: string | null = null;
    let totalQuestions = 0;
    const isComplete = Boolean(conversation?.completedAt);
    const answerCount = answers.length;

    if (questionnaire) {
      totalQuestions = questionnaire.questions.length;

      if (isComplete && lastAssistant) {
        summary = lastAssistant.content;
      } else if (!isComplete && answerCount < questionnaire.questions.length) {
        currentQuestion = questionnaire.questions[answerCount] ?? null;
      }
    }

    return {
      conversationId,
      projectSlug: project.slug,
      projectTitle: project.title,
      messages: chatMessages,
      currentQuestion,
      isComplete,
      summary,
      answerCount,
      totalQuestions,
    };
  }
}

function parseLegacyQuestionMetadata(metadata: unknown): Question | null {
  if (parseQuestionnaireMetadata(metadata)) {
    return null;
  }
  const direct = questionSchema.safeParse(metadata);
  return direct.success ? direct.data : null;
}
