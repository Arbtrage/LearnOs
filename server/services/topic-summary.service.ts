import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getModelForFlow } from "@/lib/ai/config";
import { recordAiRun } from "@/lib/ai/kernel";
import { usageFromResult } from "@/lib/ai/usage";
import { projectRepository } from "@/server/repositories/project.repository";
import { topicRepository } from "@/server/repositories/topic.repository";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const SUMMARY_MAX_TOKENS = 512;

export class TopicSummaryService {
  static async generateAndCache(userId: string, topicId: string): Promise<string> {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      throw new Error("Topic not found");
    }

    const project = await projectRepository.findById(topic.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    if (topic.aiSummary) {
      return topic.aiSummary;
    }

    const modelId = getModelForFlow("topic-summary");
    const started = Date.now();
    const prompt = [
      `Project: ${project.title}`,
      `Goal: ${project.goal}`,
      `Topic: ${topic.title}`,
      `Difficulty: ${topic.difficulty}`,
      `Description: ${topic.description}`,
      "",
      "Summarize what the learner should focus on, key outcomes, and how this topic fits their path.",
    ].join("\n");

    const { text, usage } = await generateText({
      model: google(modelId),
      system:
        "You are LearnOS Sage. Write a concise, actionable topic summary for a learner. Use markdown. 2-4 short paragraphs max.",
      prompt,
      maxOutputTokens: SUMMARY_MAX_TOKENS,
    });

    const summary = text.trim();

    await recordAiRun({
      taskId: "topic.summary",
      flow: "topic-summary",
      status: "SUCCESS",
      userId,
      projectId: project.id,
      topicId,
      model: modelId,
      latencyMs: Date.now() - started,
      attempts: 1,
      memoriesUsed: 0,
      sampledForEval: false,
      traceId: null,
      input: { prompt },
      output: { summary },
      error: null,
      ...usageFromResult(usage),
    });


    await topicRepository.updateAiSummary(topicId, summary);
    return summary;
  }
}
