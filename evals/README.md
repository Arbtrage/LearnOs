# LearnOS evals

Offline evaluation for the AI tasks defined in `lib/ai/kernel/tasks/`.

This is a Python package rather than part of the Next app for one reason:
`mlflow.genai.evaluate` and its LLM-judge scorers are Python-only. The
TypeScript MLflow SDK (`mlflow-tracing`) handles tracing, not evaluation.

## How the pieces fit

| Piece | Lives in | Role |
| --- | --- | --- |
| Golden datasets | `datasets/<task__id>.jsonl` | Curated cases, one JSON record per line |
| Exported traffic | `datasets/exported/<date>.jsonl` | Sampled `AiRun` rows, merged at load time |
| Invariant bridge | `../scripts/eval-invariants.ts` | Runs the app's real `validate` functions |
| Code scorers | `learnos_evals/scorers.py` | Deterministic; wrap the bridge |
| Judges | `learnos_evals/scorers.py` | `Correctness` plus per-task `Guidelines` |
| Gate | `learnos_evals/run.py` | Absolute threshold plus regression vs `baselines.json` |

The bridge is the important design choice. Markdown lint
(`lib/content/markdown-lint.ts`) and question normalization
(`lib/practice/normalize-questions.ts`) are production code. Reimplementing them
in Python would guarantee drift, so the Python scorers shell out to a Node CLI
that invokes the exact same task descriptors the kernel uses at generation time.

## Setup

```bash
cd evals
pip install -e ".[dev]"
```

The bridge needs the app's Node dependencies installed at the repo root
(`pnpm install`) and a generated Prisma client (`pnpm exec prisma generate`).
It does **not** need a database connection.

## Running

```bash
# Deterministic scorers only — free, no LLM calls, no Databricks.
python -m learnos_evals.run --all --no-judges

# Full run including judges (needs Databricks + a judge model key).
python -m learnos_evals.run --task topic.lesson

# Accept the current scores as the new regression baseline.
python -m learnos_evals.run --all --update-baselines
```

Environment for a full run:

| Variable | Purpose |
| --- | --- |
| `MLFLOW_TRACKING_URI` | `databricks` for the managed service |
| `MLFLOW_EXPERIMENT_ID` | Target experiment |
| `DATABRICKS_HOST` / `DATABRICKS_TOKEN` | Auth, or a `~/.databrickscfg` profile |

## Growing the dataset

`AiRun` rows are sampled at the rate each task descriptor declares
(`evalSampleRate`). Pull the unexported ones:

```bash
curl -sf -X POST -H "x-cron-secret: $CRON_SECRET" \
  "$APP_URL/api/cron/evals/export?limit=500" \
  -o "datasets/exported/$(date -u +%F).jsonl"
```

Records are marked exported server-side, so re-running will not duplicate them.
Pass `?dryRun=1` to inspect without consuming.

Anything you keep permanently should be moved into the curated seed file for its
task and must pass `pytest tests` — a golden record that fails the invariants is
a broken fixture, not a finding.

## Known limitation

Gemini judging Gemini output is a weak signal. The judge model is configurable
through MLflow; using a second provider purely for judging is worth doing before
these scores are trusted for anything beyond regression detection.
