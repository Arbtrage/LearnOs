import type { z } from "zod";
import type { questionAiItemSchema } from "@/types/practice";
import { filterValidQuestions } from "@/types/practice";

type AiQuestion = z.infer<typeof questionAiItemSchema>;

export function normalizeGeneratedQuestions(questions: AiQuestion[]): AiQuestion[] {
  return filterValidQuestions(
    questions.map((q) => {
      if (q.type === "TRUE_FALSE" && (!q.options || q.options.length === 0)) {
        return {
          ...q,
          options: [
            { id: "true", text: "True" },
            { id: "false", text: "False" },
          ],
        };
      }
      if (q.type === "SHORT_ANSWER" && (q.correctAnswer as { text?: string }).text) {
        const text = (q.correctAnswer as { text: string }).text;
        return {
          ...q,
          correctAnswer: {
            text,
            keywords: (q.correctAnswer as { keywords?: string[] }).keywords ?? [],
          },
        };
      }
      return q;
    }),
  );
}

export const MAX_GENERATIONS_PER_DAY = 3;
