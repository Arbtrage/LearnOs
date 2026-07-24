LearnOS -- Phase 3 Master Specification

> Phase 3 introduces the core learning engine: Roadmaps, Knowledge
> Graphs, Topics and Milestones.

Goal

Transform the Learning Blueprint into an actionable curriculum with
dependencies, milestones and progress tracking.

***
Scope

  Roadmap Engine
  Knowledge Graph
  Topics & Modules
  Milestones
  Topic Detail
  Progress Engine (foundation)

***
Database Changes

Topic

  id
  projectId
  title
  slug
  description
  estimatedHours
  difficulty
  order
  status
  confidenceScore
  createdAt

TopicDependency

  id
  parentTopicId
  childTopicId

Milestone

  id
  projectId
  title
  description
  dueDate
  order
  completed

TopicProgress

  id
  topicId
  userId
  completion
  confidence
  lastStudied
  totalMinutes

***
AI Output

Generate structured JSON:

  roadmap
  milestones
  topics
  dependencies
  suggestedOrder

Validate with Zod.

Persist using services.

***
Workspace Pages

/projects/[slug]/roadmap

/projects/[slug]/topics

/projects/[slug]/topics/topic

/projects/[slug]/milestones

***
Roadmap

Vertical timeline.

Stages

Foundation

Core

Practice

Revision

Mastery

Each stage expandable.

Show completion.

Show estimated duration.

***
Knowledge Graph

Use React Flow.

Nodes represent topics.

Edges represent prerequisites.

Support

  Zoom
  Pan
  Search
  Hover
  Locked
  Completed
  In Progress

No hardcoded nodes.

Driven from database.

***
Topics Page

Grid of topic cards.

Display

  Progress
  Difficulty
  Estimated Hours
  Confidence
  Prerequisites

Filters

  Completed
  In Progress
  Locked
  Difficulty

***
Topic Detail

Sections

Overview

Learning Objectives

Resources

Notes Placeholder

Practice Placeholder

Revision Placeholder

AI Summary

Progress

Dependencies

Next Recommended Topic

***
Milestones

Cards

Upcoming

Completed

Locked

Estimated Finish

Completion %

***
Progress Engine

Track

  Topic completion
  Time spent
  Confidence
  Last studied

Expose progress through services.

***
Services

RoadmapService

TopicService

DependencyService

MilestoneService

ProgressService

***
API

/api/projects/:id/roadmap

/api/projects/:id/topics

/api/topics/:id

/api/projects/:id/milestones

/api/topics/:id/progress

***
Components

RoadmapTimeline

RoadmapStage

KnowledgeGraph

TopicCard

TopicFilters

TopicHeader

DependencyBadge

MilestoneCard

ProgressRing

ConfidenceBadge

***
UX

Animated graph transitions.

Skeleton loaders.

Empty roadmap illustration.

Responsive layout.

Keyboard accessible.

***
Coding Rules

Business logic inside services.

Repositories only access Prisma.

UI remains presentation layer.

All DTOs validated.

***
Definition of Done

  Roadmap generated from blueprint.
  Knowledge graph rendered dynamically.
  Topics persisted.
  Milestones displayed.
  Progress foundation implemented.
  React Flow integrated.
  Ready for Daily Learning engine.

***
Mandatory Rule

If roadmap generation or dependency logic is uncertain:

Stop.

Ask clarification questions before implementation.

Never invent curriculum rules without confirmation.