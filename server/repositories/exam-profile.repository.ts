import { prisma } from "@/lib/db/prisma";

function toDateOnly(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const examProfileRepository = {
  async findByProjectId(projectId: string) {
    return prisma.examProfile.findUnique({
      where: { projectId },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  },

  async create(data: {
    projectId: string;
    examName: string;
    examDate: Date | string;
    syllabusMarkdown?: string | null;
    totalMarks?: number | null;
    passingMarks?: number | null;
    cramModeEnabled?: boolean;
    sections: Array<{
      title: string;
      weightPercent: number;
      topicIds: string[];
      order: number;
    }>;
  }) {
    return prisma.examProfile.create({
      data: {
        projectId: data.projectId,
        examName: data.examName,
        examDate: toDateOnly(data.examDate),
        syllabusMarkdown: data.syllabusMarkdown ?? null,
        totalMarks: data.totalMarks ?? null,
        passingMarks: data.passingMarks ?? null,
        cramModeEnabled: data.cramModeEnabled ?? false,
        sections: {
          create: data.sections.map((s) => ({
            title: s.title,
            weightPercent: s.weightPercent,
            topicIds: s.topicIds,
            order: s.order,
          })),
        },
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  },

  async update(
    projectId: string,
    data: {
      examName: string;
      examDate: Date | string;
      syllabusMarkdown?: string | null;
      totalMarks?: number | null;
      passingMarks?: number | null;
      cramModeEnabled?: boolean;
      sections: Array<{
        title: string;
        weightPercent: number;
        topicIds: string[];
        order: number;
      }>;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.examProfile.update({
        where: { projectId },
        data: {
          examName: data.examName,
          examDate: toDateOnly(data.examDate),
          syllabusMarkdown: data.syllabusMarkdown ?? null,
          totalMarks: data.totalMarks ?? null,
          passingMarks: data.passingMarks ?? null,
          cramModeEnabled: data.cramModeEnabled ?? false,
        },
      });
      await tx.examSection.deleteMany({ where: { examProfileId: profile.id } });
      await tx.examSection.createMany({
        data: data.sections.map((s) => ({
          examProfileId: profile.id,
          title: s.title,
          weightPercent: s.weightPercent,
          topicIds: s.topicIds,
          order: s.order,
        })),
      });
      return tx.examProfile.findUnique({
        where: { id: profile.id },
        include: { sections: { orderBy: { order: "asc" } } },
      });
    });
  },
};
