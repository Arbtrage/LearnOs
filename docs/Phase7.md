LearnOS -- Phase 7 Master Specification

> Phase 7 delivers Revision, Notes, Exam Mode, and Mock Tests — retention,
> exam readiness, and the “pass the exam” loop.

Goal

Close the gap between **studying** and **being exam-ready** through spaced
repetition, persistent notes, mistake tracking, exam-aware planning, and
full-length mock tests.

***
Prerequisites (Phases 1–6)

  Curriculum, daily engine, resources, practice engine

***
Scope

  Spaced repetition revision queue (SM-2 inspired)
  Revision workspace page + daily revision tasks
  Notes library linked to topics, sessions, and questions
  Mistake log auto-populated from wrong practice answers
  Exam profile (exam date, syllabus, section weights)
  Exam-aware daily planner (countdown, cram mode, weighting)
  Mock exams (multi-topic timed assessments)
  Mock exam review and readiness score (v1 heuristic)
  Replace Revision + Notes placeholders

Out of scope (Phase 8)

  Full analytics dashboards and calendar sync
  Push notifications infrastructure
  PWA offline shell

***
User Stories

  As a learner, I get a daily revision queue based on what I’m forgetting.

  As a learner, I capture notes while studying and find them by topic.

  As a learner, I see all mistakes I’ve made and can redo those questions.

  As a learner, I set my exam date and the plan prioritizes high-yield
  weak areas as the date approaches.

  As a learner, I take a timed mock exam and see my projected readiness.

***
Database Changes

RevisionCard

  id
  userId
  topicId
  questionId (nullable — concept cards possible later)
  front (prompt summary)
  back (answer summary)
  easeFactor
  intervalDays
  repetitions
  nextReviewAt
  lastReviewedAt
  lastQuality (0–5 SM-2 style)
  source (PRACTICE | MANUAL | AI)
  createdAt

Note

  id
  userId
  projectId
  topicId (nullable)
  sessionId (nullable)
  title
  bodyMarkdown
  tags (String[])
  pinned
  createdAt
  updatedAt

MistakeEntry

  id
  userId
  topicId
  questionId
  practiceAnswerId
  userAnswer (Json)
  explanation
  resolvedAt (nullable)
  createdAt

ExamProfile

  id
  projectId
  examName
  examDate
  syllabusMarkdown (optional)
  totalMarks (optional)
  passingMarks (optional)
  cramModeEnabled (auto when ≤14 days)
  createdAt
  updatedAt

ExamSection

  id
  examProfileId
  title
  weightPercent
  topicIds (String[] — many-to-many or join table ExamSectionTopic)
  order

MockExam

  id
  projectId
  title
  description
  questionIds (ordered, cross-topic)
  totalMarks
  timeLimitMinutes
  source (AI | USER | SYSTEM)
  createdAt

MockExamAttempt

  id
  userId
  mockExamId
  startedAt
  endedAt
  scorePercent
  marksObtained
  marksTotal
  readinessSnapshot (Json)

Extend StudyTask

  taskType adds REVISION | MOCK
  revisionCardIds (Json, optional batch)
  mockExamId (nullable)

***
Spaced Repetition Rules (SM-2 inspired)

  Quality ratings after review: 0–5 (Again, Hard, Good, Easy mapped)
  nextReviewAt computed server-side in RevisionService
  Daily revision budget: 20% of daily minutes or max 15 cards, whichever
    is smaller — merged into DailyPlannerService
  Cards created automatically from:
    PracticeAnswer where isCorrect=false
    User clicks “Add to revision” on topic summary
  Due cards: nextReviewAt <= today UTC

***
Exam-Aware Planner

Inputs:

  ExamProfile.examDate
  ExamSection.weightPercent
  Topic progress, confidence, weak areas
  Days remaining

Behaviors:

  >30 days: balanced coverage across stages
  15–30 days: increase weight on weak + high-weight sections
  ≤14 days: cramMode — prioritize weak high-weight topics, shorter
    resource tasks, more practice/revision ratio
  Missed days: roll forward without dropping exam-critical topics

Never remove exam date from plan calculations once set.

***
Mock Exam Flow

  User starts mock from /practice or dedicated Mock Exams section
  Timed runner (reuse PracticeRunner with multi-topic header)
  No instant feedback until submit (exam simulation mode)
  On submit: score, section breakdown, readinessSnapshot stored
  Review mode: all questions + explanations + link to notes/mistakes

Readiness score (v1 heuristic):

  40% mock exam average (last 3 attempts)
  30% topic completion weighted by ExamSection
  20% practice average last 14 days
  10% revision queue health (% due cards cleared)

Expose on overview widget; full analytics in Phase 8.

***
Workspace Pages

/projects/[slug]/revision

  Due today queue
  Upcoming cards calendar strip
  “Review session” CTA → focus-style revision runner
  Stats: due count, streak, retention rate (7-day)

/projects/[slug]/notes

  All notes searchable
  Filter by topic, tag, pinned
  Markdown editor with autosave
  Quick capture from focus mode (already has session notes — merge into
    Note model or sync on complete)

/projects/[slug]/mistakes

  Or tab under Practice: wrong answers unresolved
  “Retry mistakes” generates ad-hoc PracticeSet

/projects/[slug]/exam

  Exam profile setup wizard
  Countdown, section weights, syllabus viewer
  Mock exam list + past attempts
  Readiness gauge

/projects/[slug]/topics/[topicSlug]

  Notes tab live
  Revision tab: due cards for topic, add manual card
  Remove remaining placeholders

***
Services

RevisionService

  getDueQueue(userId, projectId, limit)
  reviewCard(userId, cardId, quality)
  createFromWrongAnswer(userId, practiceAnswerId)
  createManual(userId, topicId, front, back)
  getStats(userId, projectId)

NoteService

  list, create, update, delete, search
  syncFromSessionNotes(userId, sessionId) on task complete

MistakeService

  listUnresolved(userId, projectId)
  resolve(userId, mistakeId)
  retrySet(userId, projectId) → PracticeSet

ExamProfileService

  getOrCreate, update
  getDaysRemaining(projectId)
  getWeightedTopics(projectId)

MockExamService

  list, generate (AI cross-topic), startAttempt, submit, review
  computeReadiness(userId, projectId)

DailyPlannerService (extend)

  Inject revision batch task when due cards > 0
  Inject mock exam suggestion when ≤21 days to exam and no mock in 7 days
  Respect taskType REVISION | MOCK

SchedulerService (extend)

  Roll missed revision cards forward (increase priority, don’t delete)

***
API

GET    /api/projects/:id/revision
POST   /api/revision/cards
POST   /api/revision/cards/:id/review
GET    /api/projects/:id/notes
POST   /api/projects/:id/notes
PATCH  /api/notes/:id
DELETE /api/notes/:id
GET    /api/projects/:id/mistakes
POST   /api/mistakes/:id/resolve
GET    /api/projects/:id/exam
PUT    /api/projects/:id/exam
GET    /api/projects/:id/mock-exams
POST   /api/projects/:id/mock-exams/generate
POST   /api/mock-exams/:id/start
POST   /api/mock-exams/attempts/:id/submit
GET    /api/projects/:id/readiness

***
Components

RevisionQueue
RevisionCardFlip
RevisionReviewControls
NoteEditor
NoteList
NoteSearch
MistakeList
ExamSetupWizard
ExamCountdown
ExamSectionEditor
MockExamCard
MockExamRunner
ReadinessGauge
SyllabusViewer

***
UX

  Revision: minimal chrome like focus mode; keyboard flip (Space) and
    rate (1–4).
  Notes: autosave debounce 800ms; conflict toast if edited elsewhere.
  Exam countdown visible on Today tab when profile exists.
  Mock exam: strict timer; warning at 5 min remaining.
  Cram mode banner explains why plan intensity increased.

***
Coding Rules

  Revision intervals computed only in RevisionService.
  Exam weights must sum to 100% — validate on save.
  Mock exam questions snapshot at attempt start (question version lock).
  Never delete revision history or mock attempts.

***
Definition of Done

  RevisionCard SM-2 scheduling operational.
  /revision page live with due queue and review session.
  Notes CRUD + /notes page + focus quick capture.
  Mistake log from practice wrong answers.
  ExamProfile + exam setup + countdown on Today.
  Exam-aware planner modes (normal / cram) functional.
  At least 1 AI-generated mock exam per project type.
  Mock exam attempt + review + readiness score on overview.
  Revision + Notes sidebar placeholders removed.
  Topic detail Notes + Revision sections live.
  Lint + build pass.

***
v1 deferrals (Phase 8+)

  Full analytics dashboards and calendar sync → Phase 8
  Push notifications for revision due → Phase 8
  PWA offline shell → Phase 8
  Concept revision cards without linked questionId → future enhancement
  AI fuzzy short-answer grading → Phase 6.1 (practice); mock uses exact match

***
Mandatory Rule

Spaced repetition parameters (ease factor bounds, interval caps) must be
constants in one file — tunable without schema migration.

If exam section weights don’t cover all topics, unmapped topics use
lowest priority tier — document in UI.

If mock exam generation spans too many topics for token limits, batch by
ExamSection.

Stop and ask if cram mode behavior conflicts with user’s dailyCommitment.
