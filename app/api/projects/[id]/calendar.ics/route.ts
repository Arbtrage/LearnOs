import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CalendarService } from "@/server/services/calendar.service";

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
  const range = searchParams.get("range") === "month" ? "month" : "week";

  try {
    const ics = await CalendarService.exportIcs(session.user.id, id, range);
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="learnos-calendar.ics"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 404 },
    );
  }
}
