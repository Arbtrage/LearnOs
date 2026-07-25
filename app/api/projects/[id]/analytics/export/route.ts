import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportTypeSchema } from "@/types/analytics";
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
  const typeParam = searchParams.get("type") ?? "sessions";
  const parsed = exportTypeSchema.safeParse(typeParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  try {
    const csv = await AnalyticsService.exportCsv(
      session.user.id,
      id,
      parsed.data,
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="learnos-${parsed.data}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    const status = message.includes("rate limit") ? 429 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
