import {
  buildOnboardingSystemPrompt,
  buildOnboardingUserPrompt,
} from "@/lib/ai/prompts/onboarding";
import { getAIProvider } from "@/lib/ai/providers/gemini";
import { toUserFacingAIError } from "@/lib/ai/errors";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { messageRepository } from "@/server/repositories/message.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import {
  onboardingResponseSchema,
  questionSchema,
  type InterviewAnswerValue,
  type OnboardingState,
  type Question,
} from "@/types/onboarding";

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

      const response = await this.generateNextQuestion(
        project.goal,
        project.title,
        [],
      );

      if (response.kind === "question") {
        await messageRepository.create({
          conversationId: conversation.id,
          role: "assistant",
          content: response.assistantMessage ?? response.question.label,
          metadata: response.question,
        });
      }

      return this.loadState(conversation.id, project);
    }

    return this.loadState(conversation.id, project);
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

    const priorAnswers = await interviewAnswerRepository.listByConversationId(
      conversationId,
    );

    const response = await this.generateNextQuestion(
      conversation.project.goal,
      conversation.project.title,
      priorAnswers.map((a) => ({
        questionKey: a.questionKey,
        answer: a.answer,
      })),
      { questionKey, answer },
    );

    if (response.kind === "done") {
      await messageRepository.create({
        conversationId,
        role: "assistant",
        content: response.summary,
      });
      await conversationRepository.complete(conversationId);
      await projectRepository.updateStatus(project.id, "GENERATING");

      return this.loadState(conversationId, project);
    }

    await messageRepository.create({
      conversationId,
      role: "assistant",
      content: response.assistantMessage ?? response.question.label,
      metadata: response.question,
    });

    return this.loadState(conversationId, project);
  }

  private static async generateNextQuestion(
    goal: string,
    title: string,
    priorAnswers: Array<{ questionKey: string; answer: unknown }>,
    latestAnswer?: { questionKey: string; answer: unknown },
  ) {
    const provider = getAIProvider();
    const system = buildOnboardingSystemPrompt(goal, title);
    const prompt = buildOnboardingUserPrompt(priorAnswers, latestAnswer);

    try {
      return await provider.generateObject({
        system,
        prompt,
        schema: onboardingResponseSchema,
      });
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

    const chatMessages = messages.map((m) => {
      const parsedQuestion =
        m.metadata && m.role === "assistant"
          ? parseQuestion(m.metadata)
          : undefined;

      return {
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        ...(parsedQuestion ? { question: parsedQuestion } : {}),
      };
    });

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    let currentQuestion: Question | null = null;
    let summary: string | null = null;
    const isComplete = Boolean(conversation?.completedAt);

    if (isComplete && lastAssistant) {
      summary = lastAssistant.content;
    } else if (lastAssistant?.metadata) {
      currentQuestion = parseQuestion(lastAssistant.metadata);
    }

    return {
      conversationId,
      projectSlug: project.slug,
      projectTitle: project.title,
      messages: chatMessages,
      currentQuestion,
      isComplete,
      summary,
      answerCount: answers.length,
    };
  }
}

function parseQuestion(metadata: unknown): Question | null {
  const result = questionSchema.safeParse(metadata);
  return result.success ? result.data : null;
}

function formatAnswerForDisplay(answer: InterviewAnswerValue): string {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (typeof answer === "boolean") {
    return answer ? "Yes" : "No";
  }
  return String(answer);
}
