import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { OnboardingService } from "@/server/services/onboarding.service";

const answerBodySchema = z.object({
  action: z.literal("answer"),
  questionKey: z.string(),
  answer: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]),
});

const bootstrapBodySchema = z.object({
  action: z.literal("bootstrap"),
});

const bodySchema = z.discriminatedUnion("action", [
  answerBodySchema,
  bootstrapBodySchema,
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "bootstrap") {
      const state = await OnboardingService.bootstrapConversation(
        session.user.id,
        conversationId,
      );
      return NextResponse.json(state);
    }

    const state = await OnboardingService.submitAnswer(
      session.user.id,
      conversationId,
      parsed.data.questionKey,
      parsed.data.answer,
    );
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
