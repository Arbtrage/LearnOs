-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'MULTI_SELECT', 'SHORT_ANSWER', 'NUMERIC', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('AI', 'USER', 'IMPORT');

-- CreateEnum
CREATE TYPE "PracticeSetSource" AS ENUM ('AI', 'USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PracticeAttemptMode" AS ENUM ('DRILL', 'TIMED', 'REVIEW_WRONG');

-- CreateEnum
CREATE TYPE "StudyTaskType" AS ENUM ('STUDY', 'PRACTICE', 'REVISION', 'MOCK');

-- AlterTable
ALTER TABLE "TopicProgress" ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "StudyTask" ADD COLUMN "taskType" "StudyTaskType" NOT NULL DEFAULT 'STUDY';
ALTER TABLE "StudyTask" ADD COLUMN "practiceSetId" TEXT;

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" "TopicDifficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" "QuestionSource" NOT NULL DEFAULT 'AI',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSet" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionIds" JSONB NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "isTimed" BOOLEAN NOT NULL DEFAULT false,
    "timeLimitMinutes" INTEGER,
    "source" "PracticeSetSource" NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceSetId" TEXT,
    "topicId" TEXT NOT NULL,
    "studyTaskId" TEXT,
    "mode" "PracticeAttemptMode" NOT NULL DEFAULT 'DRILL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "scorePercent" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "questionIds" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");
CREATE INDEX "Question_isActive_idx" ON "Question"("isActive");
CREATE INDEX "PracticeSet_topicId_idx" ON "PracticeSet"("topicId");
CREATE INDEX "PracticeAttempt_userId_idx" ON "PracticeAttempt"("userId");
CREATE INDEX "PracticeAttempt_topicId_idx" ON "PracticeAttempt"("topicId");
CREATE INDEX "PracticeAttempt_practiceSetId_idx" ON "PracticeAttempt"("practiceSetId");
CREATE INDEX "PracticeAttempt_startedAt_idx" ON "PracticeAttempt"("startedAt");
CREATE INDEX "PracticeAnswer_attemptId_idx" ON "PracticeAnswer"("attemptId");
CREATE INDEX "PracticeAnswer_questionId_idx" ON "PracticeAnswer"("questionId");
CREATE UNIQUE INDEX "PracticeAnswer_attemptId_questionId_key" ON "PracticeAnswer"("attemptId", "questionId");
CREATE INDEX "StudyTask_practiceSetId_idx" ON "StudyTask"("practiceSetId");

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
