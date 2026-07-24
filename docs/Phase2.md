LearnOS -- Phase 2 Master Specification

> Phase 2 focuses on generating the user's personalized workspace after
> onboarding.

Goal

Convert the completed AI interview into a persistent Learning Project
workspace.

***
Scope

  Learning Blueprint generation
  Dynamic sidebar
  Project workspace
  Today's Dashboard
  AI Mentor panel
  Project switching
  Foundation API layer

***
Backend Flow

User completes onboarding

↓

AI returns structured JSON

↓

Validate with Zod

↓

Persist using Prisma

↓

Create project

↓

Generate default workspace

↓

Redirect to /projects/[slug]

***
Database Changes

LearningBlueprint

  id
  projectId
  title
  durationWeeks
  dailyCommitment
  methodology
  generatedBy
  version
  createdAt

LearningStage

  id
  blueprintId
  title
  description
  order

SidebarItem

  id
  projectId
  label
  icon
  route
  order
  visible

DashboardWidget

  id
  projectId
  type
  config
  order

***
AI Output Schema

Return JSON only.

Fields:

  project
  blueprint
  milestones
  sidebar
  widgets
  recommendedResources

Always validate using Zod.

Never trust model output directly.

***
Dynamic Sidebar

Render from database.

Never hardcode navigation.

Support:

  Overview
  Today
  Roadmap
  Topics
  Practice
  Revision
  Notes
  Resources
  Analytics
  AI Mentor

Different projects should generate different sidebars.

***
Workspace Layout

Top Navbar

Left Sidebar

Main Content

Right AI Panel

Resizable where possible.

***
Dashboard

Cards

  Learning Health
  Today's Tasks
  Upcoming Milestone
  Study Streak
  Revision Due

Charts use mocked data initially.

***
Today's Plan

Timeline cards

Task

Estimated duration

Priority

Status

Start CTA

***
AI Mentor

Persistent right drawer.

Built with AI SDK UI.

Suggested prompts:

  Explain this topic
  I only have 30 minutes
  Reschedule today
  Motivate me

Streaming responses.

Markdown supported.

***
Project Switching

User owns multiple projects.

Quick switcher in navbar.

Remember last opened project.

***
Services

Create:

BlueprintService

ProjectService

WorkspaceService

SidebarService

DashboardService

***
API Routes

/api/projects

/api/projects/:id

/api/projects/:id/sidebar

/api/projects/:id/dashboard

/api/projects/:id/mentor

***
Components

WorkspaceLayout

ProjectCard

Sidebar

SidebarItem

DashboardCard

MetricCard

LearningHealthCard

Timeline

MentorPanel

ProjectSwitcher

***
UX

Loading skeletons.

Empty states.

Animated transitions.

Responsive.

Keyboard accessible.

***
Coding Rules

No business logic inside components.

All persistence through services.

Repository pattern only.

Typed responses everywhere.

***
Definition of Done

  Project workspace created after onboarding.
  Dynamic sidebar driven from database.
  Dashboard rendered.
  AI mentor panel integrated.
  Multiple projects supported.
  Clean architecture maintained.

***
Mandatory Rule

If the AI response schema changes, update:

 Zod schema
 Prisma mapping
 Service layer
 UI renderer

Never parse AI output directly inside React components.

If any requirement is unclear, stop implementation and ask clarification
questions before proceeding.