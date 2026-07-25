LearnOS -- Phase 5 Master Specification

> Phase 5 delivers the Content & Resources Layer — what the learner
> actually opens and studies during a session.

Goal

Turn **existing, validated topics** into concrete learning materials so
every daily task answers: **“Open what, and do what, in these 45
minutes?”**

Phase 5 must **never invent curriculum** (topics, syllabus items, or
URLs). It **enriches** topics that already exist from Phase 3 with
grounded objectives and **verified** resources only.

***
Prerequisites (Phases 1–4)

  Auth, onboarding, blueprint, workspace shell
  Roadmap, topics, dependencies, milestones, progress (Phase 3 — source of truth for curriculum)
  Daily planner, focus mode, sessions, adaptive scheduler

***
Scope

  Learning objectives per topic (derived from topic, not free-form invention)
  Curated resource library with verification pipeline
  Resource types: article, video, book, course, exercise set, reference
  Internal TopicContent (markdown lessons — no external URL required)
  Resources workspace page
  Topic detail: objectives + resources (replace placeholders)
  Focus mode: embedded resource panel + “mark resource complete”
  Daily tasks can reference specific **verified** resources
  Blueprint v3: persist user-provided resources from onboarding
  Link health checks + domain trust tiers
  User feedback: report broken / irrelevant resource

Out of scope (later phases)

  Quizzes and scored practice (Phase 6)
  Spaced revision (Phase 7)
  Full analytics (Phase 8)

***
Core Principle: No Hallucinations

Topics (Phase 3)

  Phase 5 does NOT create or rename topics.
  Objectives and resources attach only to topicId that already exists in DB.
  AI prompts receive the exact topic title, description, slug, stage, and
  sectionKey — it must not output a different subject scope.

Objectives

  Generated only from: topic.description + blueprint stage + interview answers.
  Must be 3–6 bullet outcomes phrased as observable skills (“Calculate…”, “Explain…”).
  Rejected if generic fluff (“Understand the topic well”) — validate with Zod + lint rules.

Resources (URLs)

  **Forbidden:** model outputs a URL from memory without verification.
  **Required pipeline:** discover → verify HTTP → optional relevance check → publish.
  Unverified candidates stay in ResourceCandidate table or status PENDING — never shown in UI.

Internal content (TopicContent)

  Allowed: AI writes markdown lesson **inside** LearnOS (no external URL).
  Must cite topic fields only; no fabricated citations or fake paper titles.
  Label clearly as “LearnOS lesson” vs external link.

***
User Stories

  As a learner, I see verified links per topic — not dead or made-up URLs.

  As a learner, I know whether a resource is official docs, trusted site, or user-added.

  As a learner, I can report a broken link and get a replacement suggestion.

  As a learner, objectives match what the topic actually covers.

  As a learner, I can add my own textbook PDF link (user source skips auto-verify optional).

  As a learner, completing a verified resource updates my topic progress.

***
Database Changes

LearningObjective

  id
  topicId
  title
  description
  order
  source (ROADMAP | AI_ENRICH | USER)
  createdAt

UserObjectiveProgress

  id
  objectiveId
  userId
  completedAt

Resource

  id
  projectId
  topicId (nullable — project-wide resources allowed)
  title
  description
  url (nullable — required for external types; null for TopicContent-only)
  type (ARTICLE | VIDEO | BOOK | COURSE | EXERCISE | REFERENCE | INTERNAL | OTHER)
  source (ONBOARDING | SEARCH | AI_RANKED | USER | IMPORT)
  estimatedMinutes
  difficulty (BEGINNER | INTERMEDIATE | ADVANCED)
  order
  isRequired
  verificationStatus (PENDING | VERIFIED | FAILED | STALE | USER_PROVIDED)
  trustTier (OFFICIAL | TRUSTED | STANDARD | UNVERIFIED)
  lastCheckedAt
  lastHttpStatus
  checkError (nullable)
  canonicalUrl (normalized for dedupe)
  userEdited (boolean — if true, skip overwrite on regen)
  hidden (boolean)
  createdAt
  updatedAt

ResourceProgress

  id
  resourceId
  userId
  status (NOT_STARTED | IN_PROGRESS | COMPLETED | SKIPPED)
  completedAt
  lastOpenedAt
  timeSpentMinutes

ResourceFeedback

  id
  resourceId
  userId
  type (BROKEN | IRRELEVANT | PAYWALL | OTHER)
  comment
  createdAt

TopicContent

  id
  topicId
  title
  bodyMarkdown
  order
  generatedBy (AI | USER)
  sourceTopicHash (hash of topic title+description at generation time)
  createdAt

Extend StudyTask

  resourceId (nullable)
  objectiveIds (Json, optional)

Extend LearningProject / InterviewAnswer (read-only use)

  Pull user-stated books, courses, channels from onboarding answers for
  ONBOARDING-sourced resources (highest trust after USER).

***
Resource Acquisition Pipeline (Mandatory)

Step 1 — Gather candidates (no direct publish)

  A) Onboarding: books, courses, URLs user mentioned in interview
  B) Gemini Google Search grounding (`google.tools.googleSearch`): query built from topic.title + project.goal +
     category (e.g. “CAT quantitative aptitude percentages site:khanacademy.org”); URLs extracted from grounding metadata only
  C) Curated domain catalog: static allowlist per category (CAT, UPSC, AWS, etc.)
  D) AI rank-only mode: given candidate list WITH urls from A/B/C, AI orders,
     labels type, writes description — **must not add new URLs**

Step 2 — Normalize

  Resolve redirects; store canonicalUrl (strip utm_*, lowercase host).
  Dedupe by canonicalUrl per topicId.

Step 3 — Verify (ResourceVerificationService)

  HTTP HEAD or GET (timeout 8s, max 3 redirects)
  Accept: 200, 301/302 with resolvable final URL
  Reject: 404, 5xx, timeout, empty body for HTML, SSL errors
  Optional: fetch <title> and compare similarity to resource.title (≥0.4)
  Optional: blocklisted domains (URL shorteners, paste sites)

Step 4 — Trust tier

  OFFICIAL: user-provided exam body, docs.*.gov, vendor official docs
  TRUSTED: allowlist (Khan Academy, MIT OCW, freeCodeCamp, MDN, etc.)
  STANDARD: reachable non-blocklisted domain
  UNVERIFIED: failed relevance or unknown domain — **do not show by default**

Step 5 — Publish gate

  UI and daily planner only surface resources where:
    verificationStatus = VERIFIED OR source = USER OR source = ONBOARDING
  PENDING/FAILED/STALE: admin/dev queue or “Suggest replacement” only

Step 6 — Freshness

  Weekly cron: re-check VERIFIED resources; STALE if 404/5xx
  STALE resources: badge in UI, deprioritize in planner, trigger re-discovery

***
Domain Trust Configuration

File: config/trusted-domains.ts (and config/category-resource-seeds.ts)

  globalTrusted: [khanacademy.org, youtube.com, developer.mozilla.org, …]
  categoryTrusted: { cat: [...], upsc: [...], aws: [...] }
  blocklist: [bit.ly without expand, spam TLDs, …]

Exam-prep projects: at least 1 required resource must be OFFICIAL or TRUSTED
before topic marked “ready to study” in planner.

***
AI Output (Strict)

Roadmap enrichment pass (runs AFTER topics exist — never creates topics)

Input per topic (server-provided, immutable in prompt):

  topicId, slug, title, description, difficulty, sectionKey, stageTitle

Output JSON per topic:

  objectives[] — 3–6 items, max 120 chars each, skill-oriented
  resourceCandidates[] — ONLY if using search results passed in prompt:
    { candidateId, title, type, estimatedMinutes, isRequired, rationale }
  **No raw url field in AI output** unless candidateId maps to search result

Separate search step returns:

  candidates[]: { candidateId, url, title, snippet, domain }

Server joins candidateId → url. AI never supplies the URL string.

Lazy backfill POST /api/topics/:id/resources/generate:

  1. Load topic from DB
  2. Run discovery search (or catalog lookup)
  3. Verify each candidate
  4. AI rank + describe verified subset only
  5. Persist Resource rows with verificationStatus

TopicContent generation:

  Prompt includes: “Use only the topic description below. Do not invent
  external sources, studies, or statistics. No fake citations.”
  Store sourceTopicHash; if topic edited later, show “Regenerate lesson” banner.

Validate everything with Zod. Reject entire batch if objectives fail lint.

***
Resource Curation Rules

  Minimum 2 **verified** resources per topic (or 1 verified + 1 TopicContent).
  Maximum 8 resources per topic.
  At least 1 required verified resource per topic in exam-prep projects.
  Prefer free/open on TRUSTED domains for exam prep.
  User can add, edit, hide, reorder — USER source sets verificationStatus
    USER_PROVIDED (optional soft HTTP check, still shown).
  Never overwrite userEdited resources on regen.
  If &lt;2 verified after pipeline, show honest empty state + “Add your
    textbook” + Sage help — do NOT pad with unverified AI links.

***
Workspace Pages

/projects/[slug]/resources

  Grid/list of verified resources only (toggle: “Show unavailable” for STALE)
  Filters: topic, type, trust tier, status, required
  Trust badge: Official / Trusted / Your link
  Report broken link action

/projects/[slug]/topics/[topicSlug]

  Objectives list with checkboxes (from LearningObjective)
  ResourceList — verified external + internal lessons
  Banner if topic lacks required verified resources

/projects/[slug]/focus/[taskId]

  Side panel tabs: Sage | Resources | Objectives
  Highlight linked verified resource
  Warn if opening STALE link

***
Services

ResourceDiscoveryService

  searchForTopic(topic, projectContext) → candidates with urls from API/catalog
  getOnboardingResources(projectId) → from interview answers

ResourceVerificationService

  verifyUrl(url) → { ok, httpStatus, canonicalUrl, pageTitle }
  assignTrustTier(url, projectCategory)
  recheckStaleResources(projectId)

ResourceService

  listByProject (verified only by default)
  listByTopic
  ingestCandidates(topicId, candidates) — runs full pipeline
  createUserResource / update / hide
  markProgress
  handleFeedback → may set STALE or trigger re-discovery

ObjectiveService

  generateForTopic(topicId) — from topic text only, lint validated
  listByTopic, toggleComplete

TopicContentService

  generateLesson(topicId) — internal markdown, anti-hallucination prompt
  staleCheck via sourceTopicHash

DailyPlannerService (extend)

  Only attach resourceId where verificationStatus is VERIFIED or USER_PROVIDED
  Prefer topics missing required verified resources
  Task title: “Read: {resource.title} (25 min)”

***
API

GET    /api/projects/:id/resources
POST   /api/projects/:id/resources          (user add — USER_PROVIDED)
PATCH  /api/resources/:id
DELETE /api/resources/:id
POST   /api/resources/:id/progress
POST   /api/resources/:id/feedback
GET    /api/topics/:id/objectives
PATCH  /api/objectives/:id/complete
POST   /api/topics/:id/resources/discover  (run pipeline, no AI-only shortcut)
POST   /api/cron/resources/recheck         (secured — weekly link health)

All routes: auth + project ownership + Zod validation.

***
Components

ResourceCard (trust badge, stale warning)
ResourceList
ResourceFilters
ResourceTrustBadge
ResourceStaleBanner
ObjectiveList
ObjectiveCheckbox
FocusResourcePanel
ResourcesPage
AddResourceDialog
ReportResourceDialog
TopicContentViewer

***
UX

  Unverified resources never appear in default learner views.
  External links: new tab, rel="noopener”, “Leave LearnOS” hint.
  Broken link report → toast “Thanks — we’ll refresh suggestions”.
  Empty state explains: “We only show verified links” (builds trust).
  Required resources: visual priority border.

***
Progress Integration

  Completing verified required resource: +5% topic completion (cap 100).
  USER_PROVIDED counts same as VERIFIED for progress.
  STALE resource completion does not bump progress until re-verified or user confirms.

***
Coding Rules

  URLs enter DB only through discovery/onboarding/user — never raw LLM output.
  Verification runs server-side before first publish.
  Resource discovery uses Gemini `google.tools.googleSearch` via GOOGLE_GENERATIVE_AI_API_KEY (no separate search API); rate limit discover per topic (e.g. 3/day/project).
  No Prisma in components.
  Log verification failures for debugging; no silent publish of FAILED rows.

***
Definition of Done

  LearningObjective model tied to existing topics only; lint rejects vague objectives.
  Resource model includes verificationStatus, trustTier, lastCheckedAt.
  Discovery → verify → publish pipeline implemented (no AI-invented URLs).
  Onboarding resources ingested as ONBOARDING source.
  /resources page shows verified resources with trust badges.
  Topic detail objectives + resources live; no placeholder copy.
  Focus mode resource panel shows verified links only.
  Broken link feedback + weekly recheck cron.
  Daily planner uses verified resourceId on tasks.
  Empty topics get honest fallback — not hallucinated padding.
  config/trusted-domains.ts populated for ≥3 project categories.
  Lint + build pass.

***
Mandatory Rules

  If AI output includes a URL not present in the candidate list, discard it.

  If verification fails for all candidates, persist zero external resources —
    offer TopicContent internal lesson OR user add flow. Never publish FAILED as VERIFIED.

  Dedupe by canonicalUrl per topic before insert.

  Topics are read from DB; Phase 5 services must throw if asked to enrich a
    non-existent topicId.

  Never delete Resource or ResourceFeedback rows; hide or mark STALE instead.

  If discovery API is unavailable, fall back to onboarding + catalog + user add only —
    do not fall back to unverified AI URLs.

  If any verification or grounding rule is ambiguous, stop and request clarification
    before implementing.
