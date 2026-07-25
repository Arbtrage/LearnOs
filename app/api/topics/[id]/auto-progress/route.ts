import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProgressEngineService } from "@/server/services/progress-engine.service";
import { z } from "zod";

const overrideSchema = z.object({
  completion: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const progress = await ProgressEngineService.getDisplayProgress(
    id,
    session.user.id,
  );
  return NextResponse.json(progress);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await ProgressEngineService.setManualOverride(
    session.user.id,
    id,
    parsed.data.completion,
    parsed.data.confidence,
  );

  return NextResponse.json({
    completion: result.completion,
    confidence: result.confidence,
    autoCompletion: result.autoCompletion,
    autoConfidence: result.autoConfidence,
    manualOverride: result.manualOverride,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await ProgressEngineService.resetToAuto(session.user.id, id);

  return NextResponse.json({
    completion: result.completion,
    confidence: result.confidence,
    autoCompletion: result.autoCompletion,
    autoConfidence: result.autoConfidence,
    manualOverride: result.manualOverride,
  });
}
