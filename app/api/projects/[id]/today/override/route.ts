import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SchedulePersistenceService } from "@/server/services/schedule-persistence.service";
import { z } from "zod";

const overrideSchema = z.object({
  totalMinutes: z.number().int().min(15).max(480),
  reason: z.string().optional(),
});

export async function POST(
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

  try {
    const result = await SchedulePersistenceService.setTodayOverride(
      session.user.id,
      id,
      parsed.data.totalMinutes,
      parsed.data.reason,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 404 },
    );
  }
}
