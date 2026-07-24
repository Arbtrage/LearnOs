LearnOS -- Phase 4 Master Specification

> Phase 4 implements the Daily Learning Engine and adaptive study
> execution.

Goal

Turn the roadmap into actionable daily study sessions with scheduling,
timers, progress updates and adaptive planning.

***
Scope

  Daily Learning Engine
  Study Sessions
  Daily Planner
  Focus Mode
  Adaptive Scheduler
  Session History

***
Database Changes

StudyPlan

  id
  projectId
  date
  totalMinutes
  status
  generatedAt

StudyTask

  id
  studyPlanId
  topicId
  title
  estimatedMinutes
  priority
  order
  status

StudySession

  id
  taskId
  startedAt
  endedAt
  durationMinutes
  completed
  notes

SchedulerEvent

  id
  projectId
  reason
  oldDate
  newDate
  createdAt

***
Daily Learning Engine

Generate daily plans from roadmap.

Inputs:

  Available time
  Topic priority
  Dependencies
  Missed sessions
  Confidence score

Output:

  Ordered task list
  Estimated duration
  Break recommendations

***
Workspace Pages

/projects/[slug]/today

/projects/[slug]/focus

/projects/[slug]/sessions

/projects/[slug]/schedule

***
Today Dashboard

Display

  Today's progress
  Remaining time
  Tasks
  Streak
  Motivation card

CTA:

Start Learning

***
Focus Mode

Minimal UI.

Hide sidebar.

Show:

  Current topic
  Timer
  Notes
  AI Assistant
  Complete Task button
  Pause
  Skip

Support fullscreen.

***
Study Timer

Support

  Count up
  Pomodoro
  Custom duration

Auto-save progress every minute.

Warn before accidental exit.

***
Adaptive Scheduler

When tasks are missed:

Recalculate remaining schedule.

Respect deadlines.

Never duplicate completed work.

Log every change.

***
Session History

Timeline of completed sessions.

Display:

  Duration
  Topic
  Completion
  Notes
  Confidence gained

***
Services

DailyPlannerService

SchedulerService

SessionService

FocusService

StudyTaskService

***
API

/api/projects/:id/today

/api/projects/:id/schedule

/api/tasks/:id/start

/api/tasks/:id/complete

/api/sessions

***
Components

TodayCard

TaskList

TaskCard

StudyTimer

FocusLayout

PomodoroControls

SessionTimeline

SchedulerPreview

MotivationBanner

DailyProgress

***
UX

Fast loading.

Autosave.

Offline-friendly state handling.

Smooth task completion animations.

Accessible keyboard shortcuts.

***
Coding Rules

Scheduler logic belongs in services.

Timer state isolated from UI rendering.

Persist session updates incrementally.

Validate all inputs.

***
Definition of Done

  Daily plans generated.
  Focus Mode implemented.
  Timer operational.
  Sessions persisted.
  Adaptive rescheduling functional.
  History available.
  Ready for revision engine.

***
Mandatory Rule

Never delete historical study data.

Rescheduling must preserve completed sessions.

If scheduling rules are ambiguous, stop and request clarification before
implementing.