LearnOS -- Phase 8 Master Specification

> Phase 8 completes the product: analytics, intelligent progress,
> notifications, calendar, mobile/offline, and production polish.

Goal

Make LearnOS feel **finished** for exam and topic learners — trustworthy
metrics, proactive reminders, seamless progress tracking, and no dead-end
placeholder pages anywhere in the app.

***
Prerequisites (Phases 1–7)

  Full learning loop: plan → study → practice → revise → mock exam

***
Scope

  Analytics workspace (charts, heatmaps, trends, export)
  Auto-derived topic progress (sessions + practice + resources)
  Manual progress override retained but secondary
  Email / in-app notifications and study reminders
  Calendar export (ICS) and optional Google Calendar OAuth
  Today: optional daily time budget override
  Persisted multi-day schedule (not preview-only)
  Full Pomodoro break cycle (work + break phases)
  PWA: installable, offline revision + timer draft sync
  Keyboard shortcuts across focus, practice, revision
  Completion animations and micro-interactions
  Remove ALL remaining placeholder / “coming soon” copy
  Performance pass and error boundaries on all workspace routes
  Admin-safe feature flags for AI-heavy endpoints

Out of scope (post-v1 / commercial)

  Native iOS/Android apps
  Social study groups / leaderboards
  Marketplace for shared question banks
  Billing and team plans

***
User Stories

  As a learner, I see whether I’m on track for my exam date.

  As a learner, I get a reminder if I haven’t started today’s plan.

  As a learner, my progress updates automatically from real activity.

  As a learner, I can block study time on my calendar.

  As a learner, I can revise flashcards offline on my phone.

  As a learner, every sidebar item does something useful.

***
Database Changes

NotificationPreference

  id
  userId
  channel (EMAIL | IN_APP)
  dailyReminderEnabled
  reminderTimeLocal (HH:mm)
  timezone
  streakAlertsEnabled
  examCountdownAlertsEnabled

Notification

  id
  userId
  projectId (nullable)
  type (REMINDER | STREAK | EXAM | MILESTONE | SYSTEM)
  title
  body
  readAt
  createdAt

CalendarSync

  id
  userId
  provider (GOOGLE | ICS_ONLY)
  accessToken (encrypted, nullable)
  refreshToken (encrypted, nullable)
  calendarId (nullable)
  lastSyncedAt

StudyPlanOverride

  id
  studyPlanId
  userId
  originalMinutes
  overrideMinutes
  reason (optional)
  createdAt

AnalyticsSnapshot (daily rollup — optional for perf)

  id
  userId
  projectId
  date
  minutesStudied
  practiceScoreAvg
  revisionCardsReviewed
  mockExamScore (nullable)
  readinessScore
  metadata (Json)

Extend TopicProgress

  autoCompletion (computed cache)
  autoConfidence (computed cache)
  manualOverride (boolean — when user adjusts sliders)

***
Auto Progress Engine

ProgressEngineService.recompute(userId, topicId):

  Inputs:
    totalMinutes from sessions
    resource completion ratio
    practice attempt scores (weighted recent)
    revision card quality averages
  Outputs:
    autoCompletion (0–100)
    autoConfidence (0–100)
  Display: max(manual, auto) or blended — default blended 70% auto / 30%
    manual until user overrides, then lock manual until “reset to auto”

Triggers:

  On session complete, practice complete, resource complete, revision
  review, mock submit.

Deprecate slider as primary UI — show computed progress with “Adjust”
expandable.

***
Analytics Page

/projects/[slug]/analytics

Sections:

  Readiness over time (line chart, 30/90 days)
  Study time by topic (bar chart)
  Practice accuracy by topic (heatmap)
  Weak areas list with drill CTAs
  Streak and consistency calendar
  Mock exam history table
  Exam countdown + projected completion date (linear extrapolation)

Export:

  CSV: sessions, practice attempts, mock scores (user-initiated download)

Use server aggregates; cache AnalyticsSnapshot daily via cron or on-write
rollup.

***
Notifications

Daily reminder:

  If no completed session by reminderTimeLocal, send email + in-app.

Streak alert:

  If streak at risk (no activity today, had streak ≥3), notify once.

Exam alerts:

  30, 14, 7, 1 days before ExamProfile.examDate.

Implementation:

  Vercel Cron or external scheduler hitting /api/cron/notifications
  Resend / SendGrid for email
  In-app bell icon in navbar with unread count

***
Calendar Integration

Phase 8a (required):

  Export today’s tasks + revision block as ICS download
  Recurring daily study block based on dailyCommitment

Phase 8b (optional if OAuth complexity):

  Google Calendar two-way sync for StudyPlan tasks

***
Schedule Persistence Upgrade

  SchedulerService persists next 7 days of StudyPlan rows (status PLANNED)
  vs on-the-fly preview only
  User edits on Schedule tab: skip/move task → SchedulerEvent log
  Today override: StudyPlanOverride reduces/increases totalMinutes for
    one day only

***
Pomodoro Complete

  Phases: WORK (25m) → BREAK (5m) → WORK → LONG_BREAK (15m after 4)
  Break screen: stretch tips, revision cards optional
  Pause stops both work and break timers
  Settings in localStorage per project

***
PWA / Offline

  next-pwa or equivalent service worker
  Cache: revision due cards, recent notes, active timer state
  Queue: PATCH session tick, revision review when back online
  manifest.json + icons
  “Install app” prompt on mobile after 2nd visit

***
Keyboard Shortcuts

  Global (?): show shortcut help
  Focus: Space pause/resume, Cmd+Enter complete
  Practice: 1–9 select option, Enter next
  Revision: Space flip, 1–4 rate
  Navigation: g+t today, g+p practice, g+r revision

***
Placeholder Cleanup Checklist

  Remove app/projects/[slug]/(workspace)/[section]/page.tsx placeholder
    stubs for routes with dedicated pages
  Update SECTION_COPY — delete or redirect to real pages
  Topic detail: all sections live
  Dashboard widgets: all metrics from real services
  Sidebar: hide routes only if feature-flagged off, never “coming soon”

***
Services

AnalyticsService

  getDashboard(userId, projectId, range)
  getTopicHeatmap(userId, projectId)
  exportCsv(userId, projectId, type)
  rollupDaily(userId, projectId) — cron

ProgressEngineService

  recomputeTopic, recomputeProject
  setManualOverride, resetToAuto

NotificationService

  sendDailyReminders, sendStreakAlerts, sendExamAlerts
  listInApp(userId), markRead

CalendarService

  exportIcs(userId, projectId, range)
  syncGoogle(userId, projectId) — optional

SchedulePersistenceService

  materializeWeek(userId, projectId)
  moveTask(userId, taskId, newDate)

***
API

GET    /api/projects/:id/analytics
GET    /api/projects/:id/analytics/export
GET    /api/notifications
PATCH  /api/notifications/:id/read
GET    /api/user/notification-preferences
PUT    /api/user/notification-preferences
GET    /api/projects/:id/calendar.ics
POST   /api/projects/:id/calendar/sync
POST   /api/projects/:id/today/override
POST   /api/cron/notifications (secured cron secret)
POST   /api/projects/:id/schedule/materialize

***
Components

AnalyticsPage
ReadinessChart
StudyTimeChart
TopicHeatmap
ConsistencyCalendar
NotificationBell
NotificationPreferencesForm
CalendarExportButton
ProgressAutoBadge
ManualProgressAdjust
PomodoroBreakScreen
ShortcutHelpModal
InstallPrompt
OfflineBanner

***
UX / Performance

  Analytics charts lazy-load (dynamic import).
  Workspace routes: error.tsx + loading.tsx on all segments.
  Target LCP <2.5s on Today page.
  Optimistic UI on note save and revision review.
  Reduced motion respects prefers-reduced-motion.
  Celebrate streak milestones (7, 30 days) with subtle animation.

***
Security & Ops

  Cron routes require CRON_SECRET header.
  OAuth tokens encrypted at rest.
  Rate limits on analytics export (5/day/user).
  Feature flags in env for AI generation endpoints.

***
Coding Rules

  Analytics queries in repositories — no N+1 in UI.
  Auto progress recompute idempotent and debounced (max 1/min/topic).
  Offline queue replay in service worker must not duplicate ticks.

***
Definition of Done

  /analytics page with readiness, time, accuracy, streak views.
  Auto progress drives topic cards and dashboard health metric.
  Manual override available but not default.
  Notification preferences + daily email reminder works.
  In-app notification center works.
  ICS calendar export works.
  7-day schedule persisted and editable.
  Today time override works.
  Full Pomodoro work/break cycle.
  PWA installable; offline revision queue readable.
  Timer draft syncs after reconnect.
  All placeholder pages removed or redirected.
  Keyboard shortcuts documented and functional.
  Error boundaries on workspace routes.
  Lint + build + smoke test golden paths pass:
    onboarding → today → focus → practice → revision → mock → analytics

***
Mandatory Rule

Phase 8 is **product complete** when a new user can prepare for a timed
exam entirely inside LearnOS without hitting a “coming soon” screen.

If analytics and auto-progress formulas disagree, auto-progress is source
of truth for scheduling; analytics displays both where helpful.

If notification timezone handling is ambiguous, store user timezone on
User model and confirm on first reminder setup.

Stop and ask before adding third-party paid integrations beyond email +
optional Google Calendar.

***
Post-Completion Vision

After Phase 8, LearnOS is a complete AI Learning OS:

  Plan (blueprint + exam profile)
  Learn (resources + objectives)
  Do (daily engine + focus)
  Check (practice + mocks)
  Retain (revision + notes + mistakes)
  Measure (analytics + readiness)
  Nudge (notifications + calendar)

Future commercial phases may add teams, content marketplace, and native
apps — not required for v1 completeness.

***
v1 deferrals (shipped in Phase 8)

  Google Calendar OAuth sync — schema (`CalendarSync`) shipped; ICS export is v1; OAuth deferred to Phase 8b
  Native iOS/Android apps — PWA install + offline revision/timer queue covers mobile v1
  Content marketplace — out of scope
  Full streak milestone animations — basic dashboard metrics only; framer-motion polish optional follow-up
  Dedicated `/mistakes` route — remains on Practice tab
  Serwist integration — lightweight custom service worker used instead
