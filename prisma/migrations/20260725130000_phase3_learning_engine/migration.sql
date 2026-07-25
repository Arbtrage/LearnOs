-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "TopicDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "LearningProject" ADD COLUMN "roadmapStatus" "RoadmapStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "LearningProject" ADD COLUMN "suggestedTopicOrder" JSONB;

-- AlterTable
ALTER TABLE "LearningStage" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "LearningStage" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LearningStage" ADD COLUMN "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "difficulty" "TopicDifficulty" NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "TopicStatus" NOT NULL DEFAULT 'LOCKED',
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicDependency" (
    "id" TEXT NOT NULL,
    "parentTopicId" TEXT NOT NULL,
    "childTopicId" TEXT NOT NULL,

    CONSTRAINT "TopicDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicProgress" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completion" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "lastStudied" TIMESTAMP(3),
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_projectId_idx" ON "Topic"("projectId");
CREATE INDEX "Topic_stageId_idx" ON "Topic"("stageId");
CREATE UNIQUE INDEX "Topic_projectId_slug_key" ON "Topic"("projectId", "slug");

-- CreateIndex
CREATE INDEX "TopicDependency_parentTopicId_idx" ON "TopicDependency"("parentTopicId");
CREATE INDEX "TopicDependency_childTopicId_idx" ON "TopicDependency"("childTopicId");
CREATE UNIQUE INDEX "TopicDependency_parentTopicId_childTopicId_key" ON "TopicDependency"("parentTopicId", "childTopicId");

-- CreateIndex
CREATE INDEX "TopicProgress_userId_idx" ON "TopicProgress"("userId");
CREATE UNIQUE INDEX "TopicProgress_topicId_userId_key" ON "TopicProgress"("topicId", "userId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "LearningStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicDependency" ADD CONSTRAINT "TopicDependency_parentTopicId_fkey" FOREIGN KEY ("parentTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicDependency" ADD CONSTRAINT "TopicDependency_childTopicId_fkey" FOREIGN KEY ("childTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicProgress" ADD CONSTRAINT "TopicProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicProgress" ADD CONSTRAINT "TopicProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
