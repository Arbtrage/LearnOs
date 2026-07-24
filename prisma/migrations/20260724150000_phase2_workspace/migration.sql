-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'GENERATING';

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearningBlueprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "dailyCommitment" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearningStage" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SidebarItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sectionKey" TEXT NOT NULL DEFAULT 'learn',
    "description" TEXT,
    "config" JSONB,

    CONSTRAINT "SidebarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DashboardWidget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearningBlueprint_projectId_key" ON "LearningBlueprint"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearningStage_blueprintId_idx" ON "LearningStage"("blueprintId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SidebarItem_projectId_idx" ON "SidebarItem"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DashboardWidget_projectId_idx" ON "DashboardWidget"("projectId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "LearningBlueprint" ADD CONSTRAINT "LearningBlueprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "LearningStage" ADD CONSTRAINT "LearningStage_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "LearningBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "SidebarItem" ADD CONSTRAINT "SidebarItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LearningProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill columns when SidebarItem existed without framework fields
ALTER TABLE "SidebarItem" ADD COLUMN IF NOT EXISTS "sectionKey" TEXT NOT NULL DEFAULT 'learn';
ALTER TABLE "SidebarItem" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "SidebarItem" ADD COLUMN IF NOT EXISTS "config" JSONB;
