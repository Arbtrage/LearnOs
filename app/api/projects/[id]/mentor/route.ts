import { type UIMessage } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { buildMentorPrompt } from "@/lib/ai/prompts/mentor";
import {
  historyTruncationNote,
  truncateChatHistory,
} from "@/lib/ai/messages/truncate-history";
import { combineSystem } from "@/lib/ai/prompts/parts";
import { getAIProvider } from "@/lib/ai/providers/gemini";
import { conversationRepository } from "@/server/repositories/conversation.repository";
import { interviewAnswerRepository } from "@/server/repositories/interview-answer.repository";
import { objectiveRepository } from "@/server/repositories/objective.repository";
import { topicRepository } from "@/server/repositories/topic.repository";
import { BlueprintService } from "@/server/services/blueprint.service";
import { ProjectService } from "@/server/services/project.service";
import { SessionService } from "@/server/services/session.service";

const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  section: z.string().optional(),
  taskId: z.string().optional(),
  topicId: z.string().optional(),
  incompleteObjectives: z.array(z.string()).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const project = await ProjectService.getOwnedById(session.user.id, id);

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const blueprint = await BlueprintService.getByProjectId(project.id);
  const completedConversation =
    await conversationRepository.findLatestCompletedByProjectId(project.id);

  const interviewAnswers = completedConversation
    ? (
        await interviewAnswerRepository.listByConversationId(
          completedConversation.id,
        )
      ).map((a) => ({
        questionKey: a.questionKey,
        answer: a.answer,
      }))
    : [];

  let focusTaskTitle: string | undefined;
  let focusTaskType: string | undefined;
  let focusResourceTitle: string | undefined;
  let focusTopicId = parsed.data.topicId;

  if (parsed.data.taskId) {
    try {
      const focus = await SessionService.getTaskFocus(
        session.user.id,
        parsed.data.taskId,
      );
      focusTaskTitle = focus.title;
      focusTaskType = focus.taskType;
      focusResourceTitle = focus.resourceTitle ?? undefined;
      focusTopicId = focusTopicId ?? focus.topicId ?? undefined;
    } catch {
      // Ignore invalid task context.
    }
  }

  let focusTopicTitle: string | undefined;
  let focusTopicDescription: string | undefined;
  let incompleteObjectives = parsed.data.incompleteObjectives ?? [];

  if (focusTopicId) {
    const topic = await topicRepository.findById(focusTopicId);
    if (topic && topic.projectId === project.id) {
      focusTopicTitle = topic.title;
      focusTopicDescription = topic.description.slice(0, 400);

      if (incompleteObjectives.length === 0) {
        const objectives = await objectiveRepository.listByTopic(
          focusTopicId,
          session.user.id,
        );
        incompleteObjectives = objectives
          .filter((objective) => objective.progress.length === 0)
          .map((objective) => objective.title);
      }
    }
  }

  if (!focusResourceTitle && parsed.data.taskId) {
    try {
      const focus = await SessionService.getTaskFocus(
        session.user.id,
        parsed.data.taskId,
      );
      focusResourceTitle = focus.resourceTitle ?? undefined;
    } catch {
      // Ignore.
    }
  }

  const parts = buildMentorPrompt({
    title: project.title,
    goal: project.goal,
    blueprintTitle: blueprint?.title,
    methodology: blueprint?.methodology,
    currentMilestone: blueprint?.stages[0]?.title,
    section: parsed.data.section,
    interviewAnswers,
    focusTaskTitle,
    focusTaskType,
    focusTopicTitle,
    focusTopicDescription,
    focusResourceTitle,
    incompleteObjectives,
  });

  const { messages, truncated } = truncateChatHistory(parsed.data.messages);

  const result = await getAIProvider().streamText({
    flow: "mentor",
    system: combineSystem(parts),
    messages,
    historyNote: historyTruncationNote(truncated),
  });

  return result.toUIMessageStreamResponse();
}
