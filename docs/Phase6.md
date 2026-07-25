LearnOS -- Phase 6 Master Specification

> Phase 6 delivers the Practice & Assessment Engine — active recall,
> questions, and measurable skill checks per topic.

Goal

Let learners **practice and verify understanding** inside LearnOS instead
of only reading and timing sessions. Wrong answers feed future revision
and analytics.

***
Prerequisites (Phases 1–5)

  Full curriculum, daily engine, focus mode
  Resources and objectives on topics

***
Scope

  Question bank per topic (MCQ, multi-select, short answer, numeric)
  AI-generated question sets (validated, stored, editable)
  Practice sessions (untimed and timed drills)
  Instant feedback + explanations
  Practice workspace page
  Topic detail Practice section (replace placeholder)
  Daily planner: “Practice drill” task type
  Weak-area tagging from incorrect answers
  Integrate practice results into TopicProgress.confidence

Out of scope (later phases)

  Full mock exams spanning multiple topics (Phase 7)
  Spaced repetition scheduling (Phase 7)
  Deep analytics dashboards (Phase 8)

***
User Stories

  As a learner, I can run a 10-question drill on a topic after reading.

  As a learner, I see why an answer was wrong and what to review.

  As a learner, my daily plan includes practice tasks for weak topics.

  As a learner, I can retry only questions I got wrong.

  As a learner, I can add my own questions to a topic’s bank.

***
Database Changes

Question

  id
  topicId
  type (MCQ | MULTI_SELECT | SHORT_ANSWER | NUMERIC | TRUE_FALSE)
  prompt
  options (Json — array of { id, text } for MCQ types)
  correctAnswer (Json — flexible per type)
  explanation
  difficulty (BEGINNER | INTERMEDIATE | ADVANCED)
  tags (String[])
  source (AI | USER | IMPORT)
  isActive
  createdAt
  updatedAt

PracticeSet

  id
  topicId
  title
  description
  questionIds (ordered)
  estimatedMinutes
  isTimed
  timeLimitMinutes (nullable)
  source (AI | USER | SYSTEM)
  createdAt

PracticeAttempt

  id
  userId
  practiceSetId (nullable — ad-hoc drills may omit)
  topicId
  startedAt
  endedAt
  scorePercent
  totalQuestions
  correctCount
  mode (DRILL | TIMED | REVIEW_WRONG)

PracticeAnswer

  id
  attemptId
  questionId
  userAnswer (Json)
  isCorrect
  timeSpentSeconds
  flaggedForReview

Extend StudyTask

  taskType (STUDY | PRACTICE | REVISION | MOCK — default STUDY)
  practiceSetId (nullable)

***
Question Generation (AI)

Input: topic title, description, objectives, optional resource summaries.

Output JSON:

  questions[] (max 15 per generation batch)
  practiceSet suggestion (title, ordered question indices)

Validate with Zod.

Store questions individually; link to PracticeSet.

Regeneration adds new questions; never deletes user-attempted questions
(soft-deactivate only).

***
Scoring Rules

  MCQ / TRUE_FALSE: exact match on correctAnswer.
  MULTI_SELECT: all correct options selected, no incorrect selected.
  SHORT_ANSWER: normalized exact match OR keyword list in v1; AI-assisted fuzzy grade deferred to Phase 6.1
  NUMERIC: tolerance band (configurable per question).

Score percent = correctCount / totalQuestions * 100.

***
Weak-Area Detection

  Tag topic with weakArea=true on PracticeAttempt when score < 70%.
  Increment weakQuestionCount on TopicProgress metadata (Json field).
  DailyPlannerService boosts priority for topics with recent failed drills.

***
Workspace Pages

/projects/[slug]/practice

  Topic-grouped practice sets
  “Quick drill” — random N questions from weak topics
  Recent attempts with scores
  Filters: topic, difficulty, not yet attempted

/projects/[slug]/topics/[topicSlug]

  Practice tab: available sets, start drill, last score, weak questions

/projects/[slug]/focus/[taskId]

  When taskType=PRACTICE, render PracticeRunner instead of StudyTimer
  Or dedicated route: /projects/[slug]/practice/[attemptId]

/projects/[slug]/practice/[attemptId]

  Full-screen question runner
  Progress bar, flag question, submit, review screen

***
Practice Session Flow

  Start → create PracticeAttempt
  For each question: render by type, capture answer + time
  Submit → score server-side, persist PracticeAnswer rows
  Review screen: list wrong answers with explanations + link to resource
  Complete → update TopicProgress (confidence bump/penalty), optional
    StudySession-like duration log

***
Services

QuestionService

  listByTopic, create, update, deactivate
  generateForTopic(userId, topicId, count)

PracticeSetService

  listByProject, listByTopic, create, getById

PracticeService

  startAttempt(userId, { topicId, practiceSetId?, mode, questionCount })
  submitAnswer(userId, attemptId, questionId, answer)
  completeAttempt(userId, attemptId)
  listAttempts(userId, projectId, limit)
  getReview(userId, attemptId)

DailyPlannerService (extend)

  Allocate 1 practice task per day when weak topics exist OR every 3rd
  day for exam-prep projects
  taskType=PRACTICE, link practiceSetId or topicId

***
API

GET    /api/projects/:id/practice
GET    /api/topics/:id/questions
POST   /api/topics/:id/questions/generate
POST   /api/topics/:id/practice-sets
GET    /api/practice-sets/:id
POST   /api/practice/attempts
POST   /api/practice/attempts/:id/answer
POST   /api/practice/attempts/:id/complete
GET    /api/practice/attempts/:id/review
GET    /api/projects/:id/practice/history

***
Components

QuestionCard
McqOptions
MultiSelectOptions
ShortAnswerInput
NumericInput
PracticeRunner
PracticeProgressBar
PracticeReviewScreen
PracticeSetCard
PracticeHistoryList
WeakTopicsBanner
ExplainAnswerPanel

***
UX

  Keyboard: 1–4 for MCQ options, Enter to submit.
  Clear correct/incorrect states after review (accessible colors + icons).
  Timer visible in timed mode; auto-submit on expiry.
  Celebrate ≥80% score; encourage retry on <70%.
  Mobile-friendly tap targets on options.

***
Progress Integration

  PracticeAttempt complete:
    confidence += score-based delta (+10 if ≥80%, -5 if <50%)
    completion += min(15, scorePercent * 0.15) per attempt
  Never exceed 100% completion without explicit “mark topic complete”.

***
Coding Rules

  Grade answers server-side only — never trust client isCorrect.
  Question correctAnswer never sent to client before submission.
  Rate-limit AI question generation per user/project.

***
Definition of Done

  Question + PracticeSet + PracticeAttempt models migrated.
  AI question generation for topics works end-to-end.
  /practice page live (no placeholder).
  Topic detail Practice section functional.
  Practice runner with MCQ + at least one other type (short answer).
  Scoring, review screen, and attempt history persisted.
  Daily planner emits PRACTICE tasks.
  Weak-area signal feeds planner priority.
  Practice sidebar placeholder removed.
  Lint + build pass.

***
Mandatory Rule

Never delete PracticeAnswer or PracticeAttempt rows.

Deactivate questions with isActive=false instead of hard delete when
attempts exist.

If grading rules for short-answer are ambiguous, ship exact-match v1 and
document AI-grading as Phase 6.1 — do not block release.

If any requirement is unclear, stop and request clarification before
implementing.
