import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyticsRangeSchema } from "@/types/analytics";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") ?? "30";
  const parsed = analyticsRangeSchema.safeParse(rangeParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const data = await AnalyticsService.getDashboard(
      session.user.id,
      id,
      parsed.data,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 404 },
    );
  }
}
