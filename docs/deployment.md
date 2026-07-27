# Deployment

LearnOS targets **Vercel** for the Next.js app and **Neon** for PostgreSQL. Background jobs use the **Inngest Vercel integration**. Scheduled tasks and CI use **GitHub Actions**.

## Vercel

### Required environment variables

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `AUTH_SECRET` | Same value used locally |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth redirect: `https://<your-domain>/api/auth/callback/google` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini |
| `GOOGLE_GENERATIVE_AI_MODEL` | Optional |

### Recommended

| Variable | Notes |
| --- | --- |
| `CRON_SECRET` | Random string; secures `/api/cron/*` |
| `AI_GENERATION_ENABLED=1` | Enable AI in production |
| `MEM0_API_KEY` | Learner memory ([ai-platform.md](ai-platform.md)) |
| `DATABRICKS_*` / `MLFLOW_*` | MLflow tracing ([databricks-setup.md](databricks-setup.md)) |

### Inngest

Install the [Inngest Vercel integration](https://www.inngest.com/docs/deploy/vercel). It sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` automatically and registers `/api/inngest`.

Do not run `pnpm run dev:inngest` in production — that is local dev only.

### Deploy

```bash
git push origin main   # if Vercel is connected to the repo
# or: vercel deploy --prod
```

After env changes, trigger a redeploy so serverless functions pick up new values.

## Cron endpoints

All cron routes require header `x-cron-secret: <CRON_SECRET>`.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/cron/evals/export` | Export sampled `AiRun` rows as JSONL for golden datasets |
| `POST /api/cron/resources/recheck` | Re-validate stale resources |
| `POST /api/cron/resources/recheck-all` | Batch resource recheck |
| `POST /api/cron/notifications` | Send scheduled study reminders |

Query params for eval export:

- `limit` — max rows (default 200, max 2000)
- `dryRun=1` — preview without marking rows exported

Example:

```bash
curl -sf -X POST \
  -H "x-cron-secret: $CRON_SECRET" \
  "https://your-app.vercel.app/api/cron/evals/export?limit=500" \
  -o exported.jsonl
```

Vercel Cron or an external scheduler can hit these URLs on a schedule. GitHub Actions uses the same pattern for weekly eval dataset refresh.

## GitHub Actions

### GenAI evals (`.github/workflows/evals.yml`)

Triggers on PRs touching AI code, weekly schedule (Mondays 05:00 UTC), or manual dispatch.

**Repository secrets**

| Secret | Purpose |
| --- | --- |
| `CRON_SECRET` | Same value as Vercel `CRON_SECRET` |
| `DATABRICKS_HOST` | Optional — MLflow logging |
| `DATABRICKS_TOKEN` | Optional — MLflow auth |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional — LLM judges in full eval mode |

**Repository variables**

| Variable | Purpose |
| --- | --- |
| `LEARNOS_APP_URL` | e.g. `https://your-app.vercel.app` — for weekly eval export cron |
| `MLFLOW_TRACKING_URI` | `databricks` when using Databricks |
| `MLFLOW_EXPERIMENT_ID` | Target experiment |

When `LEARNOS_APP_URL` and `CRON_SECRET` are set, the weekly job pulls newly sampled production runs into `evals/datasets/exported/`. When Databricks secrets are missing, evals run with `--no-judges` (free, deterministic).

Manual run with dataset refresh: **Actions → GenAI evals → Run workflow** → enable **Refresh dataset**.

## Neon

Use a pooled connection string for serverless (`?sslmode=require`). Run migrations before or as part of deploy:

```bash
pnpm run db:migrate
```

For preview branches, point `DATABASE_URL` at a Neon branch or a separate database.

## Checklist — new production environment

1. Neon database + `DATABASE_URL` on Vercel
2. Auth secrets + Google OAuth redirect URI for production domain
3. Gemini API key
4. Inngest Vercel integration connected
5. `CRON_SECRET` on Vercel
6. GitHub `CRON_SECRET` secret + `LEARNOS_APP_URL` variable
7. Optional: Databricks Free Edition + four MLflow env vars
8. Optional: `MEM0_API_KEY`
9. Run migrations, deploy, smoke-test onboarding → blueprint → topic lesson → practice questions → mock exam
