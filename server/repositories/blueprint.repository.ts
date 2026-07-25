import { prisma } from "@/lib/db/prisma";
import type { LearningBlueprint, Prisma } from "@/app/generated/prisma/client";

export type CreateBlueprintInput = {
  projectId: string;
  title: string;
  durationWeeks: number;
  dailyCommitment: string;
  methodology: string;
  generatedBy: string;
  metadata?: Prisma.InputJsonValue;
  stages: Array<{ title: string; description: string; order: number }>;
};

export const blueprintRepository = {
  async findByProjectId(projectId: string): Promise<
    | (LearningBlueprint & {
        stages: Array<{
          id: string;
          title: string;
          description: string;
          order: number;
          dueDate: Date | null;
          completed: boolean;
          completedAt: Date | null;
        }>;
      })
    | null
  > {
    return prisma.learningBlueprint.findUnique({
      where: { projectId },
      include: { stages: { orderBy: { order: "asc" } } },
    });
  },

  async createWithStages(data: CreateBlueprintInput): Promise<LearningBlueprint> {
    return prisma.learningBlueprint.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        durationWeeks: data.durationWeeks,
        dailyCommitment: data.dailyCommitment,
        methodology: data.methodology,
        generatedBy: data.generatedBy,
        metadata: data.metadata,
        stages: {
          create: data.stages.map((stage) => ({
            title: stage.title,
            description: stage.description,
            order: stage.order,
          })),
        },
      },
    });
  },

  async updateStageSchedule(
    stageId: string,
    data: { dueDate?: Date | null; completed?: boolean; completedAt?: Date | null },
  ) {
    return prisma.learningStage.update({
      where: { id: stageId },
      data,
    });
  },
};
