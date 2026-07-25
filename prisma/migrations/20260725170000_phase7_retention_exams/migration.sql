-- CreateEnum
CREATE TYPE "RevisionCardSource" AS ENUM ('PRACTICE', 'MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "MockExamSource" AS ENUM ('AI', 'USER', 'SYSTEM');

-- AlterTable
ALTER TABLE "StudyTask" ADD COLUMN "revisionCardIds" JSONB,
ADD COLUMN "mockExamId" TEXT;

-- CreateTable
CREATE TABLE "RevisionCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionId" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "lastQuality" INTEGER,
    "source" "RevisionCardSource" NOT NULL DEFAULT 'PRACTICE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "topicId" TEXT,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MistakeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "practiceAnswerId" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MistakeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamProfile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "examDate" DATE NOT NULL,
    "syllabusMarkdown" TEXT,
    "totalMarks" INTEGER,
    "passingMarks" INTEGER,
    "cramModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSection" (
    "id" TEXT NOT NULL,
    "examProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weightPercent" INTEGER NOT NULL,
    "topicIds" TEXT[],
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExam" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionIds" JSONB NOT NULL,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 60,
    "source" "MockExamSource" NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockExamId" TEXT NOT NULL,
    "studyTaskId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "scorePercent" INTEGER,
    "marksObtained" INTEGER,
    "marksTotal" INTEGER,
    "questionIds" JSONB NOT NULL DEFAULT '[]',
    "readinessSnapshot" JSONB,

    CONSTRAINT "MockExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExamAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevisionCard_userId_questionId_key" ON "RevisionCard"("userId", "questionId");

-- CreateIndex
CREATE INDEX "RevisionCard_userId_nextReviewAt_idx" ON "RevisionCard"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "RevisionCard_topicId_idx" ON "RevisionCard"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_sessionId_key" ON "Note"("sessionId");

-- CreateIndex
CREATE INDEX "Note_projectId_idx" ON "Note"("projectId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_topicId_idx" ON "Note"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "MistakeEntry_practiceAnswerId_key" ON "MistakeEntry"("practiceAnswerId");

-- CreateIndex
CREATE INDEX "MistakeEntry_userId_idx" ON "MistakeEntry"("userId");

-- CreateIndex
CREATE INDEX "MistakeEntry_topicId_idx" ON "MistakeEntry"("topicId");

-- CreateIndex
CREATE INDEX "MistakeEntry_questionId_idx" ON "MistakeEntry"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamProfile_projectId_key" ON "ExamProfile"("projectId");

-- CreateIndex
CREATE INDEX "ExamSection_examProfileId_idx" ON "ExamSection"("examProfileId");

-- CreateIndex
CREATE INDEX "MockExam_projectId_idx" ON "MockExam"("projectId");

-- CreateIndex
CREATE INDEX "MockExamAttempt_userId_idx" ON "MockExamAttempt"("userId");

-- CreateIndex
CREATE INDEX "MockExamAttempt_mockExamId_idx" ON "MockExamAttempt"("mockExamId");

-- CreateIndex
CREATE INDEX "MockExamAttempt_startedAt_idx" ON "MockExamAttempt"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MockExamAnswer_attemptId_questionId_key" ON "MockExamAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "MockExamAnswer_attemptId_idx" ON "MockExamAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "MockExamAnswer_questionId_idx" ON "MockExamAnswer"("questionId");

-- CreateIndex
CREATE INDEX "StudyTask_mockExamId_idx" ON "StudyTask"("mockExamId");

-- AddForeignKey
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionCard" ADD CONSTRAINT "RevisionCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionCard" ADD CONSTRAINT "RevisionCard_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionCard" ADD CONSTRAINT "RevisionCard_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeEntry" ADD CONSTRAINT "MistakeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeEntry" ADD CONSTRAINT "MistakeEntry_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeEntry" ADD CONSTRAINT "MistakeEntry_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeEntry" ADD CONSTRAINT "MistakeEntry_practiceAnswerId_fkey" FOREIGN KEY ("practiceAnswerId") REFERENCES "PracticeAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamProfile" ADD CONSTRAINT "ExamProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examProfileId_fkey" FOREIGN KEY ("examProfileId") REFERENCES "ExamProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAnswer" ADD CONSTRAINT "MockExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAnswer" ADD CONSTRAINT "MockExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
