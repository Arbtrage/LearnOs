import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RevisionService } from "@/server/services/revision.service";
import { createRevisionCardSchema } from "@/types/revision";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createRevisionCardSchema.parse(await request.json());
    const card = await RevisionService.createManual(
      session.user.id,
      body.topicId,
      body.front,
      body.back,
    );
    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create card" },
      { status: 400 },
    );
  }
}
