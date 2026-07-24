# LearnOS -- Phase 1 Master Specification

> This is the Phase 1 implementation specification for the LearnOS
> frontend.

## Goal

Build the foundation of an AI-first learning platform.

Phase 1 includes:

-   Authentication
-   Dashboard
-   Create Learning Project
-   AI Guided Onboarding
-   Design System
-   Database foundation
-   AI integration foundation

Do **not** build roadmap generation yet.

------------------------------------------------------------------------

# Product Vision

LearnOS is an AI Learning Operating System.

Users define a learning goal.

The AI interviews them.

The AI prepares a structured learning blueprint.

Future phases will generate adaptive roadmaps.

------------------------------------------------------------------------

# Tech Stack

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS v4
-   shadcn/ui
-   Radix UI
-   Framer Motion
-   Lucide Icons
-   React Hook Form
-   Zod
-   TanStack Query
-   NextAuth.js
-   Prisma ORM
-   NeonDB (PostgreSQL)
-   Vercel AI SDK
-   AI SDK UI
-   Google Gemini
-   ESLint
-   Prettier

------------------------------------------------------------------------

# Architecture Principles

-   No monorepo.
-   Modular feature-first architecture.
-   Repository + Service pattern.
-   No Prisma access inside React components.
-   Strict TypeScript.
-   Server Components by default.
-   Client Components only when required.
-   Reusable UI primitives.
-   Semantic design tokens.

------------------------------------------------------------------------

# Folder Structure

``` text
app/
components/
components/ui/
components/common/
features/
features/auth/
features/dashboard/
features/projects/
features/onboarding/
features/ai/
lib/
lib/auth/
lib/db/
lib/ai/
lib/utils/
server/
server/services/
server/repositories/
prisma/
types/
hooks/
config/
constants/
styles/
public/
```

------------------------------------------------------------------------

# Authentication

Use NextAuth.

Do NOT use middleware.

Protect routes using server session checks.

Support:

-   Credentials
-   Google OAuth

Future-ready providers.

Create reusable auth service.

------------------------------------------------------------------------

# Database

Use Neon PostgreSQL.

Use Prisma ORM.

Create migrations.

## Models

### User

-   id
-   name
-   email
-   image
-   createdAt
-   updatedAt

### Account

NextAuth default.

### Session

NextAuth default.

### VerificationToken

NextAuth default.

### LearningProject

-   id
-   userId
-   title
-   slug
-   category
-   goal
-   status
-   icon
-   accentColor
-   createdAt
-   updatedAt

### AIConversation

-   id
-   projectId
-   startedAt
-   completedAt

### AIMessage

-   id
-   conversationId
-   role
-   content
-   metadata
-   createdAt

### InterviewAnswer

-   id
-   conversationId
-   questionKey
-   answer
-   createdAt

------------------------------------------------------------------------

# Dashboard

Authenticated only.

Display:

-   Greeting
-   Recent Projects
-   Create Project button
-   Empty state
-   Mock statistics

------------------------------------------------------------------------

# Create Learning Project

Modal.

Searchable.

Examples:

-   CAT
-   UPSC
-   AWS
-   React
-   Japanese
-   Python
-   Machine Learning

Custom goal supported.

------------------------------------------------------------------------

# AI Onboarding

Use Vercel AI SDK.

Use AI SDK UI.

Use Gemini.

Streaming enabled.

Conversation driven.

Frontend renders schema-driven questions.

Question types:

-   text
-   number
-   single select
-   multi select
-   date
-   boolean
-   slider
-   textarea

Do NOT hardcode question flow.

------------------------------------------------------------------------

# Design System

Dark-first.

Support Light/System.

Semantic tokens.

Primary Secondary Success Danger Warning Muted Surface Background Card
Border

Reusable typography scale.

Reusable spacing scale.

Reusable motion presets.

------------------------------------------------------------------------

# UI Components

Implement reusable components only.

-   Button
-   Input
-   Select
-   Card
-   EmptyState
-   LoadingState
-   PageHeader
-   Modal
-   Avatar
-   Badge
-   Progress
-   WizardStep
-   AIChat
-   QuestionRenderer

------------------------------------------------------------------------

# AI Layer

Abstract providers.

Current:

Gemini

Future:

OpenAI

Anthropic

Mistral

Never couple UI to provider implementation.

------------------------------------------------------------------------

# Coding Standards

-   No any.
-   Small reusable components.
-   Typed APIs.
-   Zod validation.
-   Repository pattern.
-   Services contain business logic.
-   Components remain presentation-only.

------------------------------------------------------------------------

# Definition of Done

-   Authentication functional.
-   Prisma schema complete.
-   Neon connected.
-   NextAuth configured.
-   Dashboard complete.
-   Create Project modal complete.
-   AI onboarding complete.
-   Design system reusable.
-   Responsive.
-   Accessible.
-   Clean architecture.

------------------------------------------------------------------------

# Mandatory Rule for the Coding Agent

If any requirement is ambiguous:

STOP.

Ask clarification questions before implementing.

Never assume business logic.

Never invent database fields.

Never skip architecture decisions.

If multiple implementation choices exist, explain the trade-offs and ask
for approval before proceeding.
