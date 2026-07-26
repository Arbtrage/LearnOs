-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('SUCCESS', 'DEGRADED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('LESSON', 'OBJECTIVES', 'RESOURCES', 'QUESTIONS', 'FLASHCARDS', 'MOCK_EXAM');

-- CreateEnum
CREATE TYPE "AssetState" AS ENUM ('MISSING', 'QUEUED', 'RUNNING', 'READY', 'FAILED', 'STALE');

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "flow" TEXT NOT NULL,
    "status" "AiRunStatus" NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "topicId" TEXT,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "memoriesUsed" INTEGER NOT NULL DEFAULT 0,
    "sampledForEval" BOOLEAN NOT NULL DEFAULT false,
    "exportedAt" TIMESTAMP(3),
    "traceId" TEXT,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetReadiness" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "topicId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "state" "AssetState" NOT NULL DEFAULT 'MISSING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastRunId" TEXT,
    "lastEventId" TEXT,
    "error" TEXT,
    "requestedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiRun_taskId_createdAt_idx" ON "AiRun"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_userId_createdAt_idx" ON "AiRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_projectId_createdAt_idx" ON "AiRun"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_sampledForEval_exportedAt_idx" ON "AiRun"("sampledForEval", "exportedAt");

-- CreateIndex
CREATE INDEX "AiRun_status_createdAt_idx" ON "AiRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AssetReadiness_projectId_state_idx" ON "AssetReadiness"("projectId", "state");

-- CreateIndex
CREATE INDEX "AssetReadiness_state_priority_idx" ON "AssetReadiness"("state", "priority");

-- CreateIndex
CREATE INDEX "AssetReadiness_topicId_idx" ON "AssetReadiness"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetReadiness_projectId_scopeKey_kind_key" ON "AssetReadiness"("projectId", "scopeKey", "kind");

-- AddForeignKey
ALTER TABLE "AssetReadiness" ADD CONSTRAINT "AssetReadiness_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetReadiness" ADD CONSTRAINT "AssetReadiness_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
