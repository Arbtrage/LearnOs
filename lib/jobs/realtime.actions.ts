"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/jobs/client";
import { projectChannel } from "@/lib/jobs/channels";
import { projectRepository } from "@/server/repositories/project.repository";

/**
 * Mints a short-lived subscription token for a project's progress channel.
 * Ownership is checked here because the token itself grants read access.
 */
export async function fetchProjectRealtimeToken(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const project = await projectRepository.findById(projectId);
  if (!project || project.userId !== session.user.id) {
    throw new Error("Project not found");
  }

  return getClientSubscriptionToken(inngest, {
    channel: projectChannel(projectId),
    topics: ["generation"],
  });
}
