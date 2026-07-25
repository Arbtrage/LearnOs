-- Phase 5: Content & Resources

CREATE TYPE "ResourceType" AS ENUM ('ARTICLE', 'VIDEO', 'BOOK', 'COURSE', 'EXERCISE', 'REFERENCE', 'INTERNAL', 'OTHER');
CREATE TYPE "ResourceSource" AS ENUM ('ONBOARDING', 'SEARCH', 'AI_RANKED', 'USER', 'IMPORT', 'CATALOG');
CREATE TYPE "ResourceVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'STALE', 'USER_PROVIDED');
CREATE TYPE "ResourceTrustTier" AS ENUM ('OFFICIAL', 'TRUSTED', 'STANDARD', 'UNVERIFIED');
CREATE TYPE "ObjectiveSource" AS ENUM ('ROADMAP', 'AI_ENRICH', 'USER');
CREATE TYPE "ResourceProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "ResourceFeedbackType" AS ENUM ('BROKEN', 'IRRELEVANT', 'PAYWALL', 'OTHER');

ALTER TABLE "StudyTask" ADD COLUMN "resourceId" TEXT;

CREATE TABLE "LearningObjective" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "source" "ObjectiveSource" NOT NULL DEFAULT 'AI_ENRICH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningObjective_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserObjectiveProgress" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserObjectiveProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "type" "ResourceType" NOT NULL DEFAULT 'ARTICLE',
    "source" "ResourceSource" NOT NULL DEFAULT 'SEARCH',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "difficulty" "TopicDifficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "ResourceVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "trustTier" "ResourceTrustTier" NOT NULL DEFAULT 'UNVERIFIED',
    "lastCheckedAt" TIMESTAMP(3),
    "lastHttpStatus" INTEGER,
    "checkError" TEXT,
    "canonicalUrl" TEXT,
    "userEdited" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceProgress" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ResourceProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ResourceProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceFeedback" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ResourceFeedbackType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicContent" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "generatedBy" TEXT NOT NULL DEFAULT 'AI',
    "sourceTopicHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicContent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LearningObjective_topicId_idx" ON "LearningObjective"("topicId");
CREATE UNIQUE INDEX "UserObjectiveProgress_objectiveId_userId_key" ON "UserObjectiveProgress"("objectiveId", "userId");
CREATE INDEX "UserObjectiveProgress_userId_idx" ON "UserObjectiveProgress"("userId");
CREATE INDEX "Resource_projectId_idx" ON "Resource"("projectId");
CREATE INDEX "Resource_topicId_idx" ON "Resource"("topicId");
CREATE INDEX "Resource_canonicalUrl_idx" ON "Resource"("canonicalUrl");
CREATE UNIQUE INDEX "ResourceProgress_resourceId_userId_key" ON "ResourceProgress"("resourceId", "userId");
CREATE INDEX "ResourceProgress_userId_idx" ON "ResourceProgress"("userId");
CREATE INDEX "ResourceFeedback_resourceId_idx" ON "ResourceFeedback"("resourceId");
CREATE INDEX "ResourceFeedback_userId_idx" ON "ResourceFeedback"("userId");
CREATE INDEX "TopicContent_topicId_idx" ON "TopicContent"("topicId");
CREATE INDEX "StudyTask_resourceId_idx" ON "StudyTask"("resourceId");

ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningObjective" ADD CONSTRAINT "LearningObjective_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserObjectiveProgress" ADD CONSTRAINT "UserObjectiveProgress_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "LearningObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserObjectiveProgress" ADD CONSTRAINT "UserObjectiveProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResourceProgress" ADD CONSTRAINT "ResourceProgress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceProgress" ADD CONSTRAINT "ResourceProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceFeedback" ADD CONSTRAINT "ResourceFeedback_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceFeedback" ADD CONSTRAINT "ResourceFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicContent" ADD CONSTRAINT "TopicContent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
