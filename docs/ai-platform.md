# AI platform

LearnOS routes every generative AI call through a small kernel so validation, retries, audit logging, optional tracing, and eval sampling stay consistent.

## Architecture

```
User action / cron / prewarm
        │
        ▼
   Inngest function          ← durable, retriable, realtime progress
        │
        ▼
   runAiTask(taskId, …)      ← lib/ai/kernel/run.ts
        │
        ├── task descriptor   ← prompt, schema, validate(), evalSampleRate
        ├── Gemini via AI SDK
        ├── recordAiRun()     ← always persisted (AiRun table)
        ├── optional Mem0     ← learner memory read/write
        └── optional MLflow   ← spans when DATABRICKS + MLFLOW env set
```

Request handlers do **not** initialize MLflow tracing. Tracing starts inside Inngest workers via `ensureTracer()` so spans can flush before serverless freeze.

## Task registry

Tasks are defined in `lib/ai/kernel/tasks/` and registered through side-effect imports in `tasks/index.ts`.

| Task ID | Purpose |
| --- | --- |
| `onboarding.questionnaire` | Turn-by-turn onboarding interview |
| `project.suggest` | Project title/description suggestions |
| `project.blueprint` | Learning blueprint after onboarding |
| `project.roadmap` | Multi-stage curriculum roadmap |
| `topic.objectives` | Learning objectives for a topic |
| `topic.lesson` | Markdown lesson content |
| `topic.resources.rank` | Rank discovered resources |
| `topic.questions` | Practice question generation |
| `project.mockExam` | Full mock exam question set |

Each descriptor includes:

- Zod output schema
- `validate()` — production quality gate (markdown lint, question normalization, etc.)
- `evalSampleRate` — fraction of successful runs copied into the eval export queue

Adding a task: create a descriptor with `defineAiTask`, export it from `tasks/index.ts`, wire an Inngest function that calls `runAiTask`, and add golden records under `evals/datasets/`.

## Inngest functions

Registered in `lib/jobs/functions/index.ts`:

| Function | Trigger | Generates |
| --- | --- | --- |
| `project-blueprint` | Onboarding complete | Blueprint + roadmap |
| `topic-enrich` | Topic opened / warm | Objectives + lesson |
| `topic-resources` | Resource discovery | Ranked resources |
| `topic-questions` | Practice requested | Question set |
| `project-mock-exam` | Mock exam created | Exam questions |
| `prewarm-*` | Schedule / navigation | Speculative asset generation |
| `memory-write` | After key interactions | Mem0 memories |

Realtime progress uses Inngest channels (`lib/jobs/channels.ts`) and client subscription tokens (`lib/jobs/realtime.actions.ts`).

## AiRun audit log

Every kernel invocation writes an `AiRun` row: task id, inputs, outputs, model, status, optional MLflow `traceId`, and an `evalExported` flag.

Sampled runs (per `evalSampleRate`) stay unexported until the cron endpoint or weekly CI job pulls them into golden datasets. See [evals/README.md](../evals/README.md).

## Mem0 memory

When `MEM0_API_KEY` is set, the kernel reads relevant memories before generation and queues writes after successful runs. Without it, behavior is identical to the pre-memory codebase — no stub failures.

## MLflow tracing

Optional. Requires:

```
DATABRICKS_HOST=https://dbc-xxxxx.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
MLFLOW_TRACKING_URI=databricks
MLFLOW_EXPERIMENT_ID=<numeric experiment id>
```

Implementation: `lib/ai/kernel/mlflow-tracer.ts` (TypeScript `mlflow-tracing` SDK). If init fails, generation continues with tracing disabled.

Setup walkthrough: [databricks-setup.md](databricks-setup.md).

## Evaluations

Offline evals run in Python because `mlflow.genai.evaluate` and LLM-judge scorers are Python-only.

Key design choice: **invariant bridge** (`scripts/eval-invariants.ts`) shells out to the same Node `validate()` functions the kernel uses — no duplicated rules in Python.

CI workflow: `.github/workflows/evals.yml`

- Always runs `pytest` on the bridge (free, deterministic)
- Runs `python -m learnos_evals.run --all --no-judges` when Databricks is not configured
- Runs full evals (with judges) when Databricks secrets + `GOOGLE_GENERATIVE_AI_API_KEY` are present

Free local/CI path:

```bash
python -m learnos_evals.run --all --no-judges
```

## Asset readiness

`AssetReadiness` tracks which AI-generated assets exist for a topic or project (lesson, questions, mock exam, etc.). The UI and prewarm jobs use it to avoid redundant generation and to show live progress states on the landing page mocks.
