import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProjectService } from "@/server/services/project.service";
import { PracticeSetService } from "@/server/services/practice-set.service";
import { PracticeService } from "@/server/services/practice.service";
import { topicProgressRepository } from "@/server/repositories/topic-progress.repository";
import type { TopicProgressMetadata } from "@/types/practice";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await ProjectService.getOwnedById(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const [sets, history, progress] = await Promise.all([
      PracticeSetService.listByProject(session.user.id, id),
      PracticeService.listHistory(session.user.id, id, 10),
      topicProgressRepository.listByProjectAndUser(id, session.user.id),
    ]);

    const weakTopics = progress
      .filter((p) => {
        const meta = (p.metadata ?? {}) as TopicProgressMetadata;
        return meta.weakArea || p.confidence < 50;
      })
      .map((p) => p.topicId);

    return NextResponse.json({ sets, history, weakTopicIds: weakTopics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load practice" },
      { status: 500 },
    );
  }
}
