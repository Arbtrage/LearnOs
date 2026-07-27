# Databricks setup (Free Edition)

LearnOS uses Databricks only as a **hosted MLflow backend** — for trace logging from production and experiment runs from the eval harness. The app works fully without it.

## What you get

| Feature | Without Databricks | With Databricks Free Edition |
| --- | --- | --- |
| AI generation | Works | Works |
| `AiRun` audit log | Works | Works |
| MLflow traces in UI | No | Yes |
| Eval runs logged to MLflow | No | Yes |
| LLM judges in evals | Needs `GOOGLE_API_KEY` only | Same — judges use Gemini, not Databricks models |

## Choose the right tier

Use **Databricks Free Edition** (perpetually free, no credit card):

- Sign up at [accounts.cloud.databricks.com](https://accounts.cloud.databricks.com)
- Select **Free Edition**, not the 14-day paid trial

Free Edition includes MLflow experiment tracking and trace storage within fair-usage limits. It is intended for learning and personal projects, not commercial production workloads.

## Step 1 — Create a workspace

After signup you land in a serverless workspace. Note the URL:

```
https://dbc-xxxxxxxx-xxxx.cloud.databricks.com
```

This becomes `DATABRICKS_HOST` (no trailing slash).

## Step 2 — Create an MLflow experiment

1. Sidebar → **Machine Learning** → **Experiments**
2. **Create experiment** → name it e.g. `learnos-ai`
3. Open the experiment and copy the **Experiment ID** (numeric, from the URL or experiment settings)

Alternatively, evals default to `/Shared/learnos-evals` if `MLFLOW_EXPERIMENT_ID` is unset — one shared experiment is simpler to manage.

### Generate API key from the experiment (optional shortcut)

In the experiment kebab menu: **Log traces locally** → **Generate API Key**. Databricks prints ready-made `export` lines including `MLFLOW_EXPERIMENT_ID`.

## Step 3 — Personal access token

1. Profile icon → **Settings** → **Developer** → **Access tokens** → **Manage**
2. **Generate new token** — name `learnos-mlflow`, lifetime e.g. 90 days
3. Copy the token (`dapi…`) — shown once

Scopes: default workspace access is sufficient for MLflow tracking on Free Edition.

## Step 4 — Environment variables

Add to `.env` (local) or your deployment platform:

```bash
DATABRICKS_HOST=https://dbc-xxxxxxxx-xxxx.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
MLFLOW_TRACKING_URI=databricks
MLFLOW_EXPERIMENT_ID=123456789012345
```

| Variable | Where to set |
| --- | --- |
| All four | `.env.local` for local Inngest tracing experiments |
| All four | Vercel project env (Production + Preview) for live traces |
| All four | GitHub repo secrets/vars for CI eval logging |

### GitHub Actions mapping

From `.github/workflows/evals.yml`:

| GitHub | Name | Type |
| --- | --- | --- |
| Secret | `DATABRICKS_HOST` | workspace URL |
| Secret | `DATABRICKS_TOKEN` | PAT |
| Variable | `MLFLOW_TRACKING_URI` | `databricks` |
| Variable | `MLFLOW_EXPERIMENT_ID` | experiment ID |

If `DATABRICKS_HOST` or `DATABRICKS_TOKEN` is missing, CI automatically runs deterministic scorers only (`--no-judges`) — no Databricks required.

## Step 5 — Verify

### Local eval logging

```bash
pnpm install && pnpm exec prisma generate
cd evals && pip install -e ".[dev]"

export DATABRICKS_HOST=...
export DATABRICKS_TOKEN=...
export MLFLOW_TRACKING_URI=databricks
export MLFLOW_EXPERIMENT_ID=...

python -m learnos_evals.run --all --no-judges
```

Check **Experiments → learnos-ai** in Databricks for runs named `eval-topic.lesson`, etc.

### Production tracing

1. Deploy with the four env vars on Vercel
2. Run Inngest-backed generation (lesson, mock exam, etc.)
3. In Databricks → experiment → **Traces**, look for spans from durable jobs

Tracing initializes only inside Inngest workers, not in ordinary HTTP request handlers.

## Cost notes

**Free on Databricks Free Edition**

- MLflow experiment and trace storage
- Logging metadata from production (no compute clusters spun up for tracing)

**Not billed by Databricks but not zero-cost**

- **LLM judges** (`python -m learnos_evals.run --all` without `--no-judges`) call Gemini via `GOOGLE_GENERATIVE_AI_API_KEY`

**Fully free eval path (recommended to start)**

```bash
python -m learnos_evals.run --all --no-judges
```

This still runs all deterministic invariant checks — the same production validation rules the kernel uses.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| CI skips Databricks | Expected if secrets unset; deterministic evals still run |
| No traces in production | Confirm env vars on Vercel + redeploy; generation must go through Inngest |
| `401` from MLflow | Regenerate PAT; check `DATABRICKS_HOST` has no trailing slash |
| Experiment not found | Verify numeric `MLFLOW_EXPERIMENT_ID` matches the workspace experiment |

## References

- [Connect your environment to MLflow](https://docs.databricks.com/en/mlflow3/genai/getting-started/connect-environment)
- [Databricks personal access tokens](https://docs.databricks.com/en/dev-tools/auth/pat)
- [LearnOS eval harness](../evals/README.md)
